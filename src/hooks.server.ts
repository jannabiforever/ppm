import { StatusCodes } from 'http-status-codes';
import { Effect, Layer, Console, Option } from 'effect';
import { SupabaseLive, SupabaseService } from '$lib/infra/supabase/layer.server';
import { makeCookiesLayer } from '$lib/infra/cookies';
import { sequence } from '@sveltejs/kit/hooks';
import { error, type Handle, redirect } from '@sveltejs/kit';
import type { Session, User } from '@supabase/supabase-js';
import { toObj } from '$lib/shared/errors';

const supabase: Handle = async ({ event, resolve }) => {
	const cookiesLayer = makeCookiesLayer(event.cookies);
	const supabaseLayer = Layer.provide(SupabaseLive, cookiesLayer);

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
	const clientData = await Effect.gen(function* () {
		const supabaseService = yield* SupabaseService;
		const session = yield* supabaseService.safeGetSessionAsync();
		const user = yield* supabaseService.safeGetUserAsync();
		return Option.some({ session, user });
	}).pipe(
		Effect.provide(event.locals.supabase),
		Effect.catchTag('NoSessionOrUser', () =>
			Effect.succeed(Option.none<{ session: Session; user: User }>())
		),
		Effect.tapError(Console.error),
		Effect.either,
		Effect.runPromise
	);

	if (clientData._tag === 'Left') {
		// TODO: What could go wrong when fetching user data?
		error(clientData.left.status, toObj(clientData.left));
	}

	Option.match(clientData.right, {
		onSome: ({ session, user }) => {
			event.locals.user = user;
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
