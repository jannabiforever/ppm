import type { Cookies } from '@sveltejs/kit';
import { Context, Effect, Layer } from 'effect';

export class CookiesService extends Context.Tag('Cookies')<
	CookiesService,
	{
		getAllSync: () => Effect.Effect<Array<{ name: string; value: string }>>;
		setAllSync: (cookiesToSet: Array<{ name: string; value: string }>) => Effect.Effect<void>;
		/**
		 * Returns a plain cookie service that can be used outside of the Effect ecosystem.
		 * @returns
		 */
		plainCookieSync: () => Effect.Effect<{
			getAll: () => Array<{ name: string; value: string }>;
			setAll: (cookiesToSet: Array<{ name: string; value: string }>) => void;
		}>;
	}
>() {}

export const makeCookiesLayer = (cookies: Cookies) =>
	Layer.succeed(
		CookiesService,
		CookiesService.of({
			getAllSync: () => Effect.sync(cookies.getAll),
			setAllSync: (cookiesToSet) =>
				Effect.sync(() =>
					cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
				),
			plainCookieSync: () =>
				Effect.succeed({
					getAll: () => cookies.getAll(),
					setAll: (
						cookiesToSet: {
							name: string;
							value: string;
						}[]
					) =>
						cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
				})
		})
	);
