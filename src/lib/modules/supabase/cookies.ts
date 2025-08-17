import type { Cookies } from '@sveltejs/kit';
import { Context, Layer } from 'effect';

export class CookiesService extends Context.Tag('Cookies')<
	CookiesService,
	{
		getAll: () => Array<{ name: string; value: string }>;
		setAll: (cookiesToSet: Array<{ name: string; value: string }>) => void;
	}
>() {}

export const makeCookiesLayer = (cookies: Cookies) =>
	Layer.succeed(
		CookiesService,
		CookiesService.of({
			getAll: cookies.getAll,
			setAll: (cookiesToSet) =>
				cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
		})
	);
