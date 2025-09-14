import type { Cookies } from '@sveltejs/kit';
import { Context, Layer } from 'effect';

/**
 * Service class providing cookie functionality through Effect's Context.
 *
 * This class serves as a wrapper around SvelteKit's Cookies API, providing
 * access to cookies through Effect's Context system.
 *
 * @example
 * ```ts
 * import { Effect } from 'effect';
 * import { Service as CookiesService } from './path-to-this-file';
 *
 * const program = Effect.gen(function* (_) {
 *   const cookiesService = yield* CookiesService;
 *   const cookies = yield* cookiesService.getAll();
 *   // Use cookies...
 * });
 * ```
 */
export class Service extends Context.Tag('Cookies')<
	Service,
	{
		/**
		 * Retrieves all cookies as an array of name-value pairs.
		 *
		 * @returns An array of objects containing cookie names and values.
		 */
		getAll: () => Array<{ name: string; value: string }>;

		/**
		 * Sets multiple cookies at once.
		 *
		 * All cookies are set with the path '/' by default.
		 *
		 * @param cookiesToSet - An array of cookie objects with name and value properties.
		 */
		setAll: (cookiesToSet: Array<{ name: string; value: string }>) => void;
	}
>() {}

/**
 * Creates an Effect Layer for the Cookies service.
 *
 * This function creates a Layer that provides the Cookies service implementation
 * based on SvelteKit's Cookies API.
 *
 * @param cookies - The SvelteKit Cookies instance to wrap.
 * @returns A Layer providing the Cookies service.
 *
 * @example
 * ```ts
 * import { makeCookiesLayer } from './path-to-this-file';
 * import { Effect } from 'effect';
 *
 * // In a SvelteKit load function:
 * export const load = ({ cookies }) => {
 *   const cookiesLayer = makeCookiesLayer(cookies);
 *   const program = Effect.gen(function* () {
 *     // Use cookies service...
 *   });
 *
 *   return Effect.runSync(program.pipe(Effect.provide(cookiesLayer)));
 * };
 * ```
 */
export const makeCookiesLayer = (cookies: Cookies) =>
	Layer.succeed(
		Service,
		Service.of({
			getAll: cookies.getAll,
			setAll: (cookiesToSet) =>
				cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
		})
	);
