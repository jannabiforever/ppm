import * as Either from 'effect/Either';
import * as Option from 'effect/Option';
import * as Supabase from '$lib/modules/supabase';
import * as UserProfile from '$lib/modules/user_profile';
import type { NoSuchElementException } from 'effect/Cause';
import type { Session } from '@supabase/supabase-js';
import { Effect, Layer, Console } from 'effect';
import { StatusCodes } from 'http-status-codes';
import { error, type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

const supabase: Handle = async ({ event, resolve }) => {
	const cookiesLayer = Supabase.makeCookiesLayer(event.cookies);
	const supabaseLayer = Layer.provide(Supabase.Service.Default, cookiesLayer);

	event.locals.supabase = supabaseLayer;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const clientData: Either.Either<
		Option.Option<{ session: Session; userAndProfile: UserProfile.UserProfile }>,
		NoSuchElementException | Supabase.AuthError | Supabase.PostgrestError
	> = await Effect.gen(function* () {
		const supabaseService = yield* Supabase.Service;
		const profileService = yield* UserProfile.Service;

		const session = yield* supabaseService.getSession();
		const user = yield* supabaseService.getUser();
		const profile = yield* profileService.getCurrentUserProfile();

		return Option.some({ session, userAndProfile: { user, profile } });
	}).pipe(
		Effect.provide(UserProfile.Service.Default),
		Effect.provide(event.locals.supabase),
		Effect.catchTags({
			NoSessionOrUser: () => Option.none(),
			UserProfileNotFound: (err) => {
				Console.error(err);
				return Option.none();
			}
		}),
		Effect.either,
		Effect.runPromise
	);

	if (Either.isLeft(clientData)) {
		// TODO: 에러 일어나는 컨텍스트 확인하기
		const err = clientData.left;
		const status = 'status' in err ? err.status : 500;
		error(status, err);
	}

	Option.match(clientData.right, {
		onSome: ({ session, userAndProfile }) => {
			event.locals.userAndProfile = userAndProfile;
			event.locals.session = session;

			if (shouldBeRedirectedToApp(event.url.pathname)) {
				redirect(StatusCodes.SEE_OTHER, '/app');
			}
		},
		onNone: () => {
			if (shouldBeGuarded(event.url.pathname)) redirect(StatusCodes.SEE_OTHER, '/auth/sign-in');
		}
	});

	return resolve(event);
};

const shouldBeGuarded = (pathname: string) => {
	return pathname.startsWith('/app');
};

const shouldBeRedirectedToApp = (pathname: string) => {
	return pathname.startsWith('/auth');
};

export const handle: Handle = sequence(supabase, authGuard);
