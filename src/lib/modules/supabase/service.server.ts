import type { Database } from '../../shared/types';
import { Context, Effect, Layer } from 'effect';
import { mapAuthError, NoSessionOrUserError, type SupabaseAuthError } from '$lib/shared/errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { CookiesService } from './cookies';

export class SupabaseService extends Context.Tag('Supabase')<
	SupabaseService,
	{
		readonly getClient: () => Effect.Effect<SupabaseClient<Database>>;
		readonly getSession: () => Effect.Effect<Session, SupabaseAuthError | NoSessionOrUserError>;
		readonly getUser: () => Effect.Effect<User, SupabaseAuthError | NoSessionOrUserError>;
	}
>() {}

export const SupabaseLive = Layer.effect(
	SupabaseService,
	Effect.gen(function* () {
		const client = yield* Effect.gen(function* () {
			const cookies = yield* CookiesService;
			return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				cookies
			});
		});

		return {
			getClient: () => Effect.succeed(client),
			getSession: () =>
				Effect.gen(function* () {
					const {
						data: { session },
						error
					} = yield* Effect.promise(() => client.auth.getSession());

					if (error) return yield* Effect.fail(mapAuthError(error));
					if (!session) return yield* Effect.fail(new NoSessionOrUserError());
					return yield* Effect.succeed(session);
				}),
			getUser: () =>
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
