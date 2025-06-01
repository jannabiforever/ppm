import {
	getAllChildProjectsFromRoot,
	getRootProject,
	updateRootProject,
	deleteRootProject,
	createChildProject,
	updateChildProject,
	deleteChildProject
} from '$lib/project.server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const projectId = params.projectId;

	const rootProject = await getRootProject(projectId);
	if (!rootProject) return error(404, 'Project not found');

	const childProjects = await getAllChildProjectsFromRoot(projectId);

	return {
		rootProject,
		childProjects
	};
};

export const actions: Actions = {
	updateRootProject: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString();
		const goal = formData.get('goal')?.toString();
		const priority = formData.get('priority')?.toString() as App.PriorityLevel;

		if (!id || !name || !goal || !priority) {
			return fail(400, { success: false, message: 'Missing required fields' });
		}

		try {
			await updateRootProject(id, { name, goal, priority });
			return { success: true };
		} catch (err) {
			console.error('Failed to update root project:', err);
			return fail(500, { success: false, message: 'Failed to update project' });
		}
	},

	deleteRootProject: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { success: false, message: 'Project ID is required' });
		}

		try {
			await deleteRootProject(id);
			throw redirect(303, '/projects');
		} catch (err) {
			if (err instanceof Response) throw err;
			console.error('Failed to delete root project:', err);
			return fail(500, { success: false, message: 'Failed to delete project' });
		}
	},

	createChildProject: async ({ request }) => {
		const formData = await request.formData();
		const rootProjectId = formData.get('rootProjectId')?.toString();
		const name = formData.get('name')?.toString();
		const goal = formData.get('goal')?.toString();

		if (!rootProjectId || !name || !goal) {
			return fail(400, { success: false, message: 'Missing required fields' });
		}

		try {
			await createChildProject(rootProjectId, { name, goal });
			return { success: true };
		} catch (err) {
			console.error('Failed to create child project:', err);
			return fail(500, { success: false, message: 'Failed to create child project' });
		}
	},

	updateChildProject: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();
		const name = formData.get('name')?.toString();
		const goal = formData.get('goal')?.toString();

		if (!id || !name || !goal) {
			return fail(400, { success: false, message: 'Missing required fields' });
		}

		try {
			await updateChildProject(id, { name, goal });
			return { success: true };
		} catch (err) {
			console.error('Failed to update child project:', err);
			return fail(500, { success: false, message: 'Failed to update child project' });
		}
	},

	deleteChildProject: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id')?.toString();

		if (!id) {
			return fail(400, { success: false, message: 'Child project ID is required' });
		}

		try {
			await deleteChildProject(id);
			return { success: true };
		} catch (err) {
			console.error('Failed to delete child project:', err);
			return fail(500, { success: false, message: 'Failed to delete child project' });
		}
	}
};
