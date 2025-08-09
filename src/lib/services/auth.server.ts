import { mapAuthError, SupabaseAuthError } from '$lib/errors';
import { Context, Effect, Layer } from 'effect';
import { SupabaseService } from './supabase';
import { type Session } from '@supabase/supabase-js';

export class AuthService extends Context.Tag('Auth')<
	AuthService,
	{
		readonly signInWithPasswordAsync: (credentials: {
			email: string;
			password: string;
		}) => Effect.Effect<Session, SupabaseAuthError>;
		readonly signOutAsync: () => Effect.Effect<void, SupabaseAuthError>;
	}
>() {}

export const AuthLive = Layer.effect(
	AuthService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;

		return {
			signInWithPasswordAsync: (credentials: { email: string; password: string }) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.auth.signInWithPassword(credentials))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapAuthError(res.error)) : Effect.succeed(res.data.session)
					)
				),
			signOutAsync: () =>
				supabase
					.getClientSync()
					.pipe(Effect.flatMap((client) => Effect.promise(() => client.auth.signOut())))
		};
	})
);
