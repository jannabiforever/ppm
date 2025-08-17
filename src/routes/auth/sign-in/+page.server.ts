import { AuthLive, AuthService, SignInSchema } from '$lib/modules/auth';
import { decodeFormData } from '$lib/decode';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Console, Effect, Layer } from 'effect';
import HttpStatusCodes from 'http-status-codes';

export const actions = {
	'sign-in': async ({ locals, request, cookies }) => {
		const formData = await request.formData();
		const decodedFormData = decodeFormData(formData, SignInSchema).pipe(
			Effect.tapError(Console.error),
			Effect.either,
			Effect.runSync
		);

		if (decodedFormData._tag === 'Left') {
			return fail(HttpStatusCodes.BAD_REQUEST, decodedFormData.left);
		}

		const result = await Effect.gen(function* () {
			const auth = yield* AuthService;
			return yield* auth.signInWithPassword(decodedFormData.right);
		}).pipe(
			Effect.provide(Layer.provide(AuthLive, locals.supabase)),
			Effect.tapError(Console.error),
			Effect.either,
			Effect.runPromise
		);

		switch (result._tag) {
			case 'Right':
				// Handle remember
				if (decodedFormData.right.remember) {
					cookies.set('email', decodedFormData.right.email, {
						httpOnly: true,
						sameSite: 'strict',
						secure: true,
						path: '/auth',
						maxAge: 60 * 60 * 24 * 30 // 30 days
					});
				}
				throw redirect(HttpStatusCodes.SEE_OTHER, '/app');
			case 'Left':
				return fail(HttpStatusCodes.UNAUTHORIZED, result.left);
		}
	},

	'sign-in-google': async ({ locals }) => {
		const result = await Effect.gen(function* () {
			const auth = yield* AuthService;
			return yield* auth.signInWithGoogleOAuth();
		}).pipe(
			Effect.provide(Layer.provide(AuthLive, locals.supabase)),
			Effect.tapError(Console.error),
			Effect.either,
			Effect.runPromise
		);

		switch (result._tag) {
			case 'Right':
				throw redirect(HttpStatusCodes.SEE_OTHER, result.right);
			case 'Left':
				return fail(HttpStatusCodes.UNAUTHORIZED, result.left);
		}
	}
} satisfies Actions;
