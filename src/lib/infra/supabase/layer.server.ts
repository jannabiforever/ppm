import type { Database } from './types';
import { Context, Effect, Layer } from 'effect';
import { mapAuthError, type SupabaseAuthError } from '$lib/shared/errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './client.server';

export class SupabaseService extends Context.Tag('Supabase')<
	SupabaseService,
	{
		readonly getClientSync: () => Effect.Effect<SupabaseClient<Database>>;
		readonly safeGetSessionAsync: () => Effect.Effect<
			{ session: Session | null; user: User | null },
			SupabaseAuthError
		>;
	}
>() {}

export const SupabaseLive = Layer.effect(
	SupabaseService,
	Effect.gen(function* () {
		const client = yield* createSupabaseServerClient;

		return {
			getClientSync: () => Effect.succeed(client),
			safeGetSessionAsync: () => {
				const sessionResult = Effect.promise(() => client.auth.getSession()).pipe(
					Effect.flatMap(({ data: { session }, error }) => {
						return error === null ? Effect.succeed(session) : Effect.fail(mapAuthError(error));
					})
				);

				const userResult = Effect.promise(() => client.auth.getUser()).pipe(
					Effect.flatMap(({ data: { user }, error }) => {
						return error === null ? Effect.succeed(user) : Effect.fail(mapAuthError(error));
					})
				);

				return Effect.all([sessionResult, userResult]).pipe(
					Effect.map(([session, user]) => ({ session, user }))
				);
			}
		};
	})
);
