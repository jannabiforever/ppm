import type { Database } from './types';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { Effect } from 'effect';
import { CookiesService } from '../cookies';

/**
 * Creates a Supabase server client with cookie handling
 */
export const createSupabaseServerClient = Effect.gen(function* () {
	const cookies = yield* CookiesService;
	const plainCookies = yield* cookies.plainCookieSync();

	const client: SupabaseClient<Database> = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: plainCookies
		}
	);

	return client;
});
