import type { Cookies } from '@sveltejs/kit';
import { Context, Layer } from 'effect';

export class Service extends Context.Tag('Cookies')<
	Service,
	{
		getAll: () => Array<{ name: string; value: string }>;
		setAll: (cookiesToSet: Array<{ name: string; value: string }>) => void;
	}
>() {}

export const makeCookiesLayer = (cookies: Cookies) =>
	Layer.succeed(
		Service,
		Service.of({
			getAll: cookies.getAll,
			setAll: (cookiesToSet) =>
				cookiesToSet.forEach((cookie) => cookies.set(cookie.name, cookie.value, { path: '/' }))
		})
	);
