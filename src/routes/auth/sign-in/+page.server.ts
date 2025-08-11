import { AuthLive, AuthService } from '$lib/services/auth.server';
import { fail, type Actions } from '@sveltejs/kit';
import { Effect } from 'effect';
import HttpStatusCodes from 'http-status-codes';

export const actions = {
	'sign-in': async ({ locals, request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';

		if (!email || !password) {
			// TODO: Error handling.
			fail(HttpStatusCodes.BAD_REQUEST, { message: '이메일과 비밀번호가 입력되지 않았습니다.' });
		}

		const signInWithPasswordAsync = Effect.gen(function* () {
			const auth = yield* AuthService;
			const session = yield* auth.signInWithPasswordAsync({ email, password });
			return session;
		}).pipe(Effect.provide(AuthLive), Effect.provide(locals.supabase));

		await Effect.runPromise(signInWithPasswordAsync);

		// TODO: Redirect
	},
	'sign-in-google': async () => {
		// TODO: Google OAuth2
	}
} satisfies Actions;
