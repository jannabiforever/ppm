import { redirect } from '@sveltejs/kit';
import HttpStatusCodes from 'http-status-codes';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	throw redirect(HttpStatusCodes.MOVED_PERMANENTLY, '/app/today');
};
