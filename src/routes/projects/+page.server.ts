import { getAllRootProjects, createRootProject } from '$lib/project.server';
import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rootProjects = await getAllRootProjects();

	return {
		projects: rootProjects
	};
};

export const actions = {
	addNewProject: async ({ request }) => {
		const data = await request.formData();

		const name = data.get('name')?.toString() || '';
		const goal = data.get('goal')?.toString() || '';
		const priority = (data.get('priority')?.toString() as App.PriorityLevel) || 'medium';

		// Basic validation
		if (!name) {
			return { success: false, error: 'Project name is required' };
		}

		if (!goal) {
			return { success: false, error: 'Project goal is required' };
		}

		if (!priority || !['high', 'medium', 'low'].includes(priority)) {
			return { success: false, error: 'Priority must be high, medium, or low' };
		}

		try {
			// 새 프로젝트 추가 메서드 사용
			const newProject = await createRootProject({
				name,
				goal,
				priority
			});

			console.log('Created new project:', newProject);

			// Return success
			return {
				success: true,
				project: newProject
			};
		} catch (error) {
			console.error('Failed to create project:', error);
			return {
				success: false,
				error: 'Failed to create project'
			};
		}
	}
} satisfies Actions;
