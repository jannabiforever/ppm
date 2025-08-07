import type { Database } from '$lib/database.types';
import { Context, Effect, Layer } from 'effect';
import { CookiesService } from './cookies';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { mapAuthError, SupabaseAuthError } from '$lib/errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';

export class SupabaseService extends Context.Tag('Supabase')<
	SupabaseService,
	{
		readonly getClientSync: () => Effect.Effect<SupabaseClient>;
		readonly safeGetSessionAsync: () => Effect.Effect<
			{ session: Session | null; user: User | null },
			SupabaseAuthError
		>;
	}
>() {}

export const SupabaseLive = Layer.effect(
	SupabaseService,
	Effect.gen(function* () {
		const cookies = yield* CookiesService;
		const client: SupabaseClient<Database> = createServerClient(
			PUBLIC_SUPABASE_URL,
			PUBLIC_SUPABASE_ANON_KEY,
			{
				cookies: Effect.runSync(cookies.plainCookieSync())
			}
		);

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
