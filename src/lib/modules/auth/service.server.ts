import { mapAuthError, SupabaseAuthError } from '$lib/shared/errors';
import { Context, Effect, Layer, Schema } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import { SignInSchema, SignUpSchema } from './schema';

export class AuthService extends Context.Tag('Auth')<
	AuthService,
	{
		readonly signInWithPasswordAsync: (
			credentials: Schema.Schema.Type<typeof SignInSchema>
		) => Effect.Effect<void, SupabaseAuthError>;
		/**
		 *
		 * @returns Effect<string>: redirect url
		 */
		readonly signInWithGoogleOAuthAsync: () => Effect.Effect<string, SupabaseAuthError>;
		readonly signOutAsync: () => Effect.Effect<void, SupabaseAuthError>;
		readonly signUpAsync: (
			credential: Schema.Schema.Type<typeof SignUpSchema>
		) => Effect.Effect<void, SupabaseAuthError>;
	}
>() {}

export const AuthLive = Layer.effect(
	AuthService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;

		return {
			signInWithPasswordAsync: (credentials: Schema.Schema.Type<typeof SignInSchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client.auth.signInWithPassword({
								email: credentials.email,
								password: credentials.password
							})
						)
					),
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				),
			signInWithGoogleOAuthAsync: () => {
				return supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.auth.signInWithOAuth({ provider: 'google' }))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapAuthError(res.error)) : Effect.succeed(res.data.url)
					)
				);
			},
			signOutAsync: () =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => Effect.promise(() => client.auth.signOut())),
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				),
			signUpAsync: (credential: Schema.Schema.Type<typeof SignUpSchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client.auth.signUp({
								email: credential.email,
								password: credential.password
							})
						)
					),
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				)
		};
	})
);
