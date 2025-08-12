import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import HttpStatusCodes from 'http-status-codes';

export const load: PageLoad = async () => {
	throw redirect(HttpStatusCodes.PERMANENT_REDIRECT, '/auth/sign-in');
};
