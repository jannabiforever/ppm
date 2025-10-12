import { Effect } from 'effect';
import * as S from 'effect/Schema';
import * as Supabase from '../supabase/index.server';
import { SignInSchema, SignUpSchema } from './types';

/**
 * Service class for managing authentication operations.
 * Provides methods for user authentication including password-based sign-in, OAuth, and sign-out.
 */
export class Service extends Effect.Service<Service>()('AuthService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();

		const signInWithPassword = (credentials: S.Schema.Type<typeof SignInSchema>) =>
			Effect.promise(() =>
				client.auth.signInWithPassword({
					email: credentials.email,
					password: credentials.password
				})
			).pipe(
				Effect.flatMap((res) =>
					res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
				)
			);

		const signInWithGoogleOAuth = () => {
			return supabase.getClient().pipe(
				Effect.flatMap((client) =>
					Effect.promise(() => client.auth.signInWithOAuth({ provider: 'google' }))
				),
				Effect.flatMap((res) =>
					res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.succeed(res.data.url)
				)
			);
		};

		const signOut = () =>
			Effect.promise(() => client.auth.signOut()).pipe(
				Effect.flatMap((res) =>
					res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
				)
			);

		const signUp = (credential: S.Schema.Type<typeof SignUpSchema>) =>
			Effect.promise(() =>
				client.auth.signUp({
					email: credential.email,
					password: credential.password
				})
			).pipe(
				Effect.flatMap((res) =>
					res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
				)
			);

		return {
			/**
			 * Signs in a user using email and password credentials.
			 *
			 * @param credentials - The user's email and password
			 * @returns Effect containing void on success
			 * @throws {Supabase.AuthError} When authentication fails
			 */
			signInWithPassword,
			/**
			 * Initiates Google OAuth sign-in flow.
			 *
			 * @returns Effect containing the OAuth redirect URL
			 * @throws {Supabase.AuthError} When OAuth initialization fails
			 */
			signInWithGoogleOAuth,

			/**
			 * Signs out the currently authenticated user.
			 *
			 * @returns Effect containing void on success
			 * @throws {Supabase.AuthError} When sign-out fails
			 */
			signOut,

			/**
			 * Creates a new user account with email and password.
			 *
			 * @param credential - The user's email, password, and password confirmation
			 * @returns Effect containing void on success
			 * @throws {Supabase.AuthError} When user creation fails
			 */
			signUp
		};
	})
}) {}
