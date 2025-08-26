import { Effect } from 'effect';
import * as S from 'effect/Schema';
import * as Supabase from '$lib/modules/supabase/index.server';
import { SignInSchema, SignUpSchema } from './types';

export class Service extends Effect.Service<Service>()('AuthService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();

		return {
			signInWithPassword: (credentials: S.Schema.Type<typeof SignInSchema>) =>
				Effect.promise(() =>
					client.auth.signInWithPassword({
						email: credentials.email,
						password: credentials.password
					})
				).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
					)
				),
			signInWithGoogleOAuth: () => {
				return supabase.getClient().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.auth.signInWithOAuth({ provider: 'google' }))
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(new Supabase.AuthError(res.error))
							: Effect.succeed(res.data.url)
					)
				);
			},
			signOut: () =>
				Effect.promise(() => client.auth.signOut()).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
					)
				),
			signUp: (credential: S.Schema.Type<typeof SignUpSchema>) =>
				Effect.promise(() =>
					client.auth.signUp({
						email: credential.email,
						password: credential.password
					})
				).pipe(
					Effect.flatMap((res) =>
						res.error ? Effect.fail(new Supabase.AuthError(res.error)) : Effect.void
					)
				)
		};
	})
}) {}
