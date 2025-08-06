import { redirect } from '@sveltejs/kit';
import HttpStatusCodes from 'http-status-codes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	redirect(HttpStatusCodes.SEE_OTHER, '/auth/login');
};
