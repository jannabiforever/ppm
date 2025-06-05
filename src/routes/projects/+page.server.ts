import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createRootProject, selectAllRootProjects } from '$lib/db/rootProject.server';
import { selectChildProjectWithId } from '$lib/db/childProject.server';
import { selectTasksByIds } from '$lib/db/task.server';
import { sortByPriority } from '$lib/util';

export const load: PageServerLoad = async () => {
	const rootProjects = await selectAllRootProjects().then(sortByPriority);

	return {
		projects: rootProjects.map(async (rootProject) => {
			const childProjects = await Promise.all(
				rootProject.childProjectIds.map(async (childProjectId) => {
					const childProject = await selectChildProjectWithId(childProjectId);
					return childProject;
				})
			).then((projects) => projects.filter((project) => project !== null));

			// Collect all task IDs from child projects
			const allTaskIds = childProjects.flatMap(project => project?.taskIds || []);
			
			// Fetch all tasks at once
			const tasks = await selectTasksByIds(allTaskIds);
			
			// Create a map for quick task lookup
			const tasksMap = tasks.reduce((map, task) => {
				map[task.id] = task;
				return map;
			}, {} as Record<string, App.Task>);

			return {
				rootProject,
				childProjects,
				tasksMap
			};
		})
	};
};

export const actions = {
	addNewProject: async ({ request }) => {
		const data = await request.formData();

		const name = data.get('name')?.toString() || '';
		const goal = data.get('goal')?.toString() || '';
		const priority = data.get('priority')?.toString() as App.PriorityLevel;

		// Basic validation
		if (!name) {
			return { success: false, error: '프로젝트 이름은 필수입니다.' };
		}

		if (!goal) {
			return { success: false, error: '프로젝트 목표는 필수입니다.' };
		}

		if (!priority || !['high', 'medium', 'low', 'system'].includes(priority)) {
			return { success: false, error: '우선순위는 high, medium, low, system 중 하나여야 합니다.' };
		}

		try {
			// 새 프로젝트 추가 메서드 사용
			const newProject = await createRootProject({
				name,
				goal,
				priority
			});

			if (!newProject) {
				throw Error('DB 오류가 발생했습니다.');
			}

			console.log('프로젝트를 생성했습니다:', newProject);

			// Return success
			return {
				success: true,
				project: newProject
			};
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(errMsg);
			return {
				success: false,
				error: `프로젝트를 생성하는 데에 실패했습니다: ${errMsg}`
			};
		}
	}
} satisfies Actions;
