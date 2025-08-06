import type { Cookies } from '@sveltejs/kit';
import { Context, Effect, Layer } from 'effect';

export class CookiesService extends Context.Tag('Cookies')<
	CookiesService,
	{
		getAll: () => Effect.Effect<Array<{ name: string; value: string }>>;
		setAll: (cookiesToSet: Array<{ name: string; value: string }>) => Effect.Effect<void>;
	}
>() {}

export const makeCookiesLayer = (cookies: Cookies) =>
	Layer.succeed(
		CookiesService,
		CookiesService.of({
			getAll: () => Effect.sync(cookies.getAll),
			setAll: (cookiesToSet) =>
				Effect.sync(() =>
					cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
				)
		})
	);
