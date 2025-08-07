import HttpStatusCodes from 'http-status-codes';
import { Effect, Layer, Console } from 'effect';
import { SupabaseLive, SupabaseService } from '$lib/services/supabase';
import { makeCookiesLayer } from '$lib/services/cookies';
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

	if (!session && event.url.pathname.startsWith('/app')) {
		redirect(HttpStatusCodes.SEE_OTHER, '/auth/login');
	}

	if (session && event.url.pathname === '/auth/login') {
		redirect(HttpStatusCodes.SEE_OTHER, '/app');
	}

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
