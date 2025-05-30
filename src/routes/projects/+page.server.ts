import { getAllRootProjects } from '$lib/project.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rootProjects = await getAllRootProjects();
	rootProjects.sort((a, b) => a.priority - b.priority);

	return {
		projects: rootProjects
	};
};
