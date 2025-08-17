import { mapAuthError, SupabaseAuthError } from '$lib/shared/errors';
import { Context, Effect, Layer, Schema } from 'effect';
import { SupabaseService } from '$lib/modules/supabase/service.server';
import { SignInSchema, SignUpSchema } from './schema';

export class AuthService extends Context.Tag('AuthService')<
	AuthService,
	{
		readonly signInWithPassword: (
			credentials: Schema.Schema.Type<typeof SignInSchema>
		) => Effect.Effect<void, SupabaseAuthError>;
		/**
		 *
		 * @returns Effect<string>: redirect url
		 */
		readonly signInWithGoogleOAuth: () => Effect.Effect<string, SupabaseAuthError>;
		readonly signOut: () => Effect.Effect<void, SupabaseAuthError>;
		readonly signUp: (
			credential: Schema.Schema.Type<typeof SignUpSchema>
		) => Effect.Effect<void, SupabaseAuthError>;
	}
>() {}

export const AuthLive = Layer.effect(
	AuthService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClient();

		return {
			signInWithPassword: (credentials: Schema.Schema.Type<typeof SignInSchema>) =>
				Effect.promise(() =>
					client.auth.signInWithPassword({
						email: credentials.email,
						password: credentials.password
					})
				).pipe(
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				),
			signInWithGoogleOAuth: () => {
				return supabase.getClient().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.auth.signInWithOAuth({ provider: 'google' }))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapAuthError(res.error)) : Effect.succeed(res.data.url)
					)
				);
			},
			signOut: () =>
				Effect.promise(() => client.auth.signOut()).pipe(
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				),
			signUp: (credential: Schema.Schema.Type<typeof SignUpSchema>) =>
				Effect.promise(() =>
					client.auth.signUp({
						email: credential.email,
						password: credential.password
					})
				).pipe(
					Effect.flatMap((res) => (res.error ? Effect.fail(mapAuthError(res.error)) : Effect.void))
				)
		};
	})
);
