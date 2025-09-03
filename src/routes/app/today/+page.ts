import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { StatusCodes } from 'http-status-codes';

export const load: PageLoad = async () => {
	redirect(StatusCodes.SEE_OTHER, '/app/today/tasks');
};
