import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { selectRootProjectWithId } from '$lib/db/rootProject.server';
import { selectChildProjectWithId } from '$lib/db/childProject.server';

export const load: PageServerLoad = async ({ params }) => {
	const rootProjectId = params.rootProjectId;

	const rootProject = await selectRootProjectWithId(rootProjectId);
	if (!rootProject) return error(404, 'Project not found');

	const childProjects = await Promise.all(
		rootProject.childProjectIds.map(selectChildProjectWithId)
	).then((childProjects) => childProjects.filter((p) => p !== null));

	return {
		rootProject,
		childProjects
	};
};

export const actions: Actions = {
	updateRootProject: async () => {
		// TODO: Implement updateRootProject action
		return;
	},

	deleteRootProject: async () => {
		// TODO: Implement deleteRootProject action
		return;
	},

	createChildProject: async () => {
		// TODO: Implement createChildProject action
		return;
	},

	updateChildProject: async () => {
		// TODO: Implement updateChildProject action
		return;
	},

	deleteChildProject: async () => {
		// TODO: Implement deleteChildProject action
		return;
	}
};
