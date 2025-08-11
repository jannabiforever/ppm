import { AuthLive, AuthService, SignInSchema } from '$lib/modules/auth';
import { decodeFormData } from '$lib/parse';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Effect, Layer } from 'effect';
import HttpStatusCodes from 'http-status-codes';

export const actions = {
	'sign-in': async ({ locals, request }) => {
		const formData = await request.formData();
		const decodedFormData = decodeFormData(formData, SignInSchema).pipe(
			Effect.either,
			Effect.runSync
		);

		if (decodedFormData._tag === 'Left') {
			return fail(HttpStatusCodes.BAD_REQUEST, { error: decodedFormData.left });
		}

		const result = await Effect.gen(function* () {
			const auth = yield* AuthService;
			return yield* auth.signInWithPasswordAsync(decodedFormData.right);
		}).pipe(
			Effect.provide(Layer.provide(AuthLive, locals.supabase)),
			Effect.either,
			Effect.runPromise
		);

		switch (result._tag) {
			case 'Right':
				return redirect(HttpStatusCodes.SEE_OTHER, '/app');
			case 'Left':
				return fail(HttpStatusCodes.UNAUTHORIZED, { error: result.left });
		}
	},

	'sign-in-google': async ({ locals }) => {
		const result = await Effect.gen(function* () {
			const auth = yield* AuthService;
			return yield* auth.signInWithGoogleOAuthAsync();
		}).pipe(
			Effect.provide(Layer.provide(AuthLive, locals.supabase)),
			Effect.either,
			Effect.runPromise
		);

		switch (result._tag) {
			case 'Right':
				return redirect(HttpStatusCodes.SEE_OTHER, result.right);
			case 'Left':
				return fail(HttpStatusCodes.UNAUTHORIZED, { error: result.left });
		}
	}
} satisfies Actions;
