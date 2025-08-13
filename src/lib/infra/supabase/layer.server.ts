import type { Database } from './types';
import { Context, Effect, Layer } from 'effect';
import { mapAuthError, NoSessionOrUserError, type SupabaseAuthError } from '$lib/shared/errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './client.server';

export class SupabaseService extends Context.Tag('Supabase')<
	SupabaseService,
	{
		readonly getClientSync: () => Effect.Effect<SupabaseClient<Database>>;
		readonly safeGetSessionAsync: () => Effect.Effect<
			Session,
			SupabaseAuthError | NoSessionOrUserError
		>;
		readonly safeGetUserAsync: () => Effect.Effect<User, SupabaseAuthError | NoSessionOrUserError>;
	}
>() {}

export const SupabaseLive = Layer.effect(
	SupabaseService,
	Effect.gen(function* () {
		const client = yield* createSupabaseServerClient;

		return {
			getClientSync: () => Effect.succeed(client),
			safeGetSessionAsync: () =>
				Effect.gen(function* () {
					const {
						data: { session },
						error
					} = yield* Effect.promise(() => client.auth.getSession());

					if (error) return yield* Effect.fail(mapAuthError(error));
					if (!session) return yield* Effect.fail(new NoSessionOrUserError());
					return yield* Effect.succeed(session);
				}),
			safeGetUserAsync: () =>
				Effect.gen(function* () {
					const {
						data: { user },
						error
					} = yield* Effect.promise(() => client.auth.getUser());

					if (error) return yield* Effect.fail(mapAuthError(error));
					if (!user) return yield* Effect.fail(new NoSessionOrUserError());
					return yield* Effect.succeed(user);
				})
		};
	})
);
