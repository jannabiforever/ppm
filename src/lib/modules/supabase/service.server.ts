import type { Database } from '$lib/shared/database.types';
import { Effect } from 'effect';
import { AuthError, NoSessionOrUserError } from './errors';
import { type Session, type SupabaseClient, type User } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import * as Cookies from './cookies';

/**
 * Service class that provides access to Supabase functionality through Effect-based APIs.
 * This service handles authentication, session management, and client access.
 */
export class Service extends Effect.Service<Service>()('infra/supabase', {
	effect: Effect.gen(function* () {
		const cookies = yield* Cookies.Service;
		const client = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, { cookies });
		return {
			/**
			 * Retrieves the Supabase client instance.
			 *
			 * @returns {Effect.Effect<SupabaseClient<Database>>} An Effect that resolves to the Supabase client
			 */
			getClient: (): Effect.Effect<SupabaseClient<Database>> => Effect.succeed(client),

			/**
			 * Retrieves the current user session.
			 *
			 * @returns {Effect.Effect<Session, AuthError | NoSessionOrUserError>} An Effect that resolves to the user session
			 *   - Succeeds with the Session object if a valid session exists
			 *   - Fails with AuthError if there was an authentication error
			 *   - Fails with NoSessionOrUserError if no session exists
			 */
			getSession: (): Effect.Effect<Session, AuthError | NoSessionOrUserError> =>
				Effect.promise(() => client.auth.getSession()).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new AuthError(res.error)) : Effect.succeed(res.data.session)
					),
					Effect.flatMap((session) =>
						session ? Effect.succeed(session) : Effect.fail(new NoSessionOrUserError())
					)
				),

			/**
			 * Retrieves the currently authenticated user.
			 *
			 * @returns {Effect.Effect<User, AuthError | NoSessionOrUserError>} An Effect that resolves to the user
			 *   - Succeeds with the User object if a valid user exists
			 *   - Fails with AuthError if there was an authentication error
			 *   - Fails with NoSessionOrUserError if no user exists
			 */
			getUser: (): Effect.Effect<User, AuthError | NoSessionOrUserError> =>
				Effect.promise(() => client.auth.getUser()).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new AuthError(res.error)) : Effect.succeed(res.data.user)
					)
				)
		};
	})
}) {}
