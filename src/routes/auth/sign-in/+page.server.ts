import * as Auth from '$lib/modules/infra/auth/index.server';
import * as Either from 'effect/Either';
import * as S from 'effect/Schema';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Console, Effect, Layer } from 'effect';
import { StatusCodes } from 'http-status-codes';
import { mapDomainError } from '$lib/shared/errors';

export const actions = {
	'sign-in': async ({ locals, request, cookies }) => {
		const programResources = Layer.provide(Auth.Service.Default, locals.supabase);
		const formData = await request.formData();
		const program: Either.Either<typeof Auth.SignInSchema.Type & { remember: boolean }, App.Error> =
			await Effect.gen(function* () {
				const email = formData.get('email');
				const password = formData.get('password');
				const remember = formData.get('remember') === 'on';

				const result = yield* S.decodeUnknown(Auth.SignInSchema)({
					email,
					password
				});

				const authService = yield* Auth.Service;
				yield* authService.signInWithPassword(result);

				return {
					...result,
					remember
				};
			}).pipe(
				Effect.provide(programResources),
				Effect.tapError(Console.error),
				Effect.catchAll((err) => {
					if (err._tag === 'ParseError')
						return Effect.fail({
							type: err._tag,
							title: `잘못된 요청입니다: ${err.message}`,
							status: StatusCodes.BAD_REQUEST
						} as App.Error);
					return Effect.fail(mapDomainError(err));
				}),
				Effect.either,
				Effect.runPromise
			);

		return Either.match(program, {
			onRight: (result) => {
				if (result.remember) {
					cookies.set('email', result.email, {
						httpOnly: true,
						sameSite: 'strict',
						secure: true,
						path: '/auth',
						maxAge: 60 * 60 * 24 * 30 // 30 days
					});
				}

				return redirect(StatusCodes.SEE_OTHER, '/app');
			},
			onLeft: (error) => {
				return fail(error.status, error);
			}
		});
	}
} satisfies Actions;
