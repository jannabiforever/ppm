import type { Database } from '$lib/shared/database.types';
import { Effect } from 'effect';
import { mapAuthError, NoSessionOrUserError } from '$lib/shared/errors';
import { type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import * as Cookies from './cookies';

export class Service extends Effect.Service<Service>()('SupabaseService', {
	effect: Effect.gen(function* () {
		const cookies = yield* Cookies.Service;
		const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies });
		return {
			getClient: (): Effect.Effect<SupabaseClient<Database>> => Effect.succeed(client),
			getSession: () =>
				Effect.gen(function* () {
					const {
						data: { session },
						error
					} = yield* Effect.promise(() => client.auth.getSession());
					if (error) return yield* Effect.fail(mapAuthError(error));
					if (!session) return yield* Effect.fail(new NoSessionOrUserError());
					return session;
				}),
			getUser: () =>
				Effect.gen(function* () {
					const {
						data: { user },
						error
					} = yield* Effect.promise(() => client.auth.getUser());
					if (error) return yield* Effect.fail(mapAuthError(error));
					if (!user) return yield* Effect.fail(new NoSessionOrUserError());
					return user;
				})
		};
	})
}) {}
