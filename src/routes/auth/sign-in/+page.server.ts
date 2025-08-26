import * as Auth from '$lib/modules/auth/index.server';
import * as Either from 'effect/Either';
import { decodeFormData } from '$lib/decode';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Console, Effect, Layer } from 'effect';
import HttpStatusCodes from 'http-status-codes';

export const actions = {
	'sign-in': async ({ locals, request, cookies }) => {
		const formData = await request.formData();
		const decodedFormData = decodeFormData(formData, Auth.SignInSchema).pipe(
			Effect.tapError(Console.error),
			Effect.either,
			Effect.runSync
		);

		if (Either.isLeft(decodedFormData)) {
			return fail(HttpStatusCodes.BAD_REQUEST, decodedFormData.left);
		}

		const result = await Effect.gen(function* () {
			const auth = yield* Auth.Service;
			return yield* auth.signInWithPassword(decodedFormData.right);
		}).pipe(
			Effect.provide(Layer.provide(Auth.Service.Default, locals.supabase)),
			Effect.tapError(Console.error),
			Effect.either,
			Effect.runPromise
		);

		return Either.match(result, {
			onRight: () => {
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
				return redirect(HttpStatusCodes.SEE_OTHER, '/app');
			},
			onLeft: (error) => {
				return fail(HttpStatusCodes.UNAUTHORIZED, error);
			}
		});
	}
} satisfies Actions;
