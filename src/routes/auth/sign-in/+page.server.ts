import * as Auth from '$lib/modules/auth/index.server';
import * as Either from 'effect/Either';
import * as S from 'effect/Schema';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Console, Effect, Layer } from 'effect';
import HttpStatusCodes from 'http-status-codes';
import type { ParseError } from 'effect/ParseResult';

export const actions = {
  'sign-in': async ({ locals, request, cookies }) => {
    const formData = await request.formData();
    const decoded: Either.Either<
      typeof Auth.SignInSchema.Type & { remember: boolean },
      ParseError
    > = Effect.gen(function* () {
      const email = formData.get('email');
      const password = formData.get('password');
      const remember = formData.get('remember') === 'on';

      const result = yield* S.decodeUnknown(Auth.SignInSchema)({
        email,
        password
      });

      return {
        ...result,
        remember
      };
    }).pipe(Effect.tapError(Console.error), Effect.either, Effect.runSync);

    if (Either.isLeft(decoded)) {
      return fail(HttpStatusCodes.BAD_REQUEST, decoded.left);
    }

    const result = await Effect.gen(function* () {
      const auth = yield* Auth.Service;
      return yield* auth.signInWithPassword(decoded.right);
    }).pipe(
      Effect.provide(Layer.provide(Auth.Service.Default, locals.supabase)),
      Effect.tapError(Console.error),
      Effect.either,
      Effect.runPromise
    );

    return Either.match(result, {
      onRight: () => {
        // Handle remember
        if (decoded.right.remember) {
          cookies.set('email', decoded.right.email, {
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
