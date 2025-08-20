import type { Database } from '$lib/shared/database.types';
import { Effect } from 'effect';
import { AuthError, NoSessionOrUserError } from './errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import * as Cookies from './cookies';

export class Service extends Effect.Service<Service>()('SupabaseService', {
	effect: Effect.gen(function* () {
		const cookies = yield* Cookies.Service;
		const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies });
		return {
			getClient: (): Effect.Effect<SupabaseClient<Database>> => Effect.succeed(client),
			getSession: (): Effect.Effect<Session, AuthError | NoSessionOrUserError> =>
				Effect.promise(() => client.auth.getSession()).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new AuthError(res.error)) : Effect.succeed(res.data.session)
					),
					Effect.flatMap((session) =>
						session ? Effect.succeed(session) : Effect.fail(new NoSessionOrUserError())
					)
				),
			getUser: (): Effect.Effect<User, AuthError | NoSessionOrUserError> =>
				Effect.promise(() => client.auth.getUser()).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new AuthError(res.error)) : Effect.succeed(res.data.user)
					)
				)
		};
	})
}) {}
