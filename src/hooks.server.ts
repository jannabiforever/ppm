import HttpStatusCodes from 'http-status-codes';
import { Effect, Layer, Console } from 'effect';
import { SupabaseLive, SupabaseService } from '$lib/infra/supabase/layer.server';
import { makeCookiesLayer } from '$lib/infra/cookies';
import { sequence } from '@sveltejs/kit/hooks';
import { type Handle, redirect } from '@sveltejs/kit';

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
	const safeGetSessionAsync = Effect.gen(function* () {
		const supabaseService = yield* SupabaseService;
		const result = yield* supabaseService.safeGetSessionAsync();
		return result;
	}).pipe(
		Effect.provide(event.locals.supabase),
		Effect.catchAll((error) => {
			Console.error(error);
			return Effect.succeed({ session: null, user: null });
		})
	);

	const { session, user } = await Effect.runPromise(safeGetSessionAsync);

	event.locals.user = user;
	event.locals.session = session;

	if (!session && isProtectedRoute(event.url.pathname)) {
		throw redirect(HttpStatusCodes.SEE_OTHER, '/auth/sign-in');
	}

	if (session && isPublicRoute(event.url.pathname)) {
		throw redirect(HttpStatusCodes.SEE_OTHER, '/app');
	}

	return resolve(event);
};

const isProtectedRoute = (pathname: string) => {
	return pathname.startsWith('/app');
};

const isPublicRoute = (pathname: string) => {
	return pathname.startsWith('/auth');
};

export const handle: Handle = sequence(supabase, authGuard);
