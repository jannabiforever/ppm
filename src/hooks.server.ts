import * as Either from 'effect/Either';
import * as Option from 'effect/Option';
import * as Supabase from '$lib/modules/supabase/index.server';
import * as UserProfile from '$lib/modules/user_profile/index.server';
import type { Session, User } from '@supabase/supabase-js';
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
		Option.Option<{ session: Session; user: User; profile: UserProfile.Profile }>,
		Supabase.AuthError | Supabase.PostgrestError
	> = await Effect.gen(function* () {
		const supabaseService = yield* Supabase.Service;
		const profileService = yield* UserProfile.Service;

		const session = yield* supabaseService.getSession();
		const user = yield* supabaseService.getUser();
		const profile = yield* profileService.getCurrentUserProfile();

		return Option.some({ session, user, profile });
	}).pipe(
		Effect.provide(UserProfile.Service.Default),
		Effect.provide(event.locals.supabase),
		Effect.catchTags({
			NoSessionOrUser: () => Effect.succeed(Option.none()),
			AssociatedProfileNotFound: (err) => {
				Console.error(err);
				return Effect.succeed(Option.none());
			}
		}),
		Effect.either,
		Effect.runPromise
	);

	if (Either.isLeft(clientData)) {
		const err = clientData.left;
		switch (err._tag) {
			case 'SupabaseAuth':
				if (shouldBeGuarded(event.url.pathname))
					return redirect(StatusCodes.SEE_OTHER, '/auth/sign-in');
				return resolve(event);
			case 'SupabasePostgrest':
				return error(StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	Option.match(clientData.right, {
		onSome: ({ session, user, profile }) => {
			event.locals.user = user;
			event.locals.profile = profile;
			event.locals.session = session;

			if (shouldBeRedirectedToApp(event.url.pathname)) {
				redirect(StatusCodes.SEE_OTHER, '/app');
			}
		},
		onNone: () => {
			if (shouldBeGuarded(event.url.pathname)) redirect(StatusCodes.UNAUTHORIZED, '/auth/sign-in');
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
