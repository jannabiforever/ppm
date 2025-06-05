import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	deleteRootProject,
	selectRootProjectWithId,
	updateRootProject
} from '$lib/db/rootProject.server';
import {
	createChildProject,
	deleteChildProject,
	selectChildProjectWithId
} from '$lib/db/childProject.server';
import { createTask, selectTasksByIds } from '$lib/db/task.server';

export const load: PageServerLoad = async ({ params }) => {
	const rootProjectId = params.rootProjectId;

	const rootProject = await selectRootProjectWithId(rootProjectId);
	if (!rootProject) return error(404, 'Project not found');

	const childProjects = await Promise.all(
		rootProject.childProjectIds.map(selectChildProjectWithId)
	).then((childProjects) => childProjects.filter((p) => p !== null));

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
};

export const actions: Actions = {
	updateRootProject: async ({ params, request }) => {
		const rootProjectId = params.rootProjectId;
		const data = await request.formData();

		const name = data.get('name')?.toString() || '';
		const goal = data.get('goal')?.toString() || '';
		const priority = data.get('priority')?.toString() as App.PriorityLevel;

		if (!priority || !['high', 'medium', 'low', 'system'].includes(priority)) {
			return { success: false, error: '우선순위는 high, medium, low, system 중 하나여야 합니다.' };
		}

		try {
			// 새 프로젝트 추가 메서드 사용
			const newProject = await updateRootProject(rootProjectId, {
				name,
				goal,
				priority
			});

			if (!newProject) {
				throw Error('DB 오류가 발생했습니다.');
			}

			console.log('프로젝트를 수정했습니다:', newProject);

			// Return success
			return {
				success: true
			};
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(errMsg);
			return {
				success: false,
				error: `프로젝트를 생성하는 데에 실패했습니다: ${errMsg}`
			};
		}
	},

	deleteRootProject: async ({ params }) => {
		const rootProjectId = params.rootProjectId;

		try {
			const rootProject = await selectRootProjectWithId(rootProjectId);
			if (!rootProject) return error(404, 'Project not found');

			const deletedRootProject = await deleteRootProject(rootProjectId);
			if (!deletedRootProject) return error(500, 'Failed to delete project');

			const deletedChildProjects = await Promise.all(
				rootProject.childProjectIds.map(deleteChildProject)
			);

			const numberOfFailedChildProjectDeletions = deletedChildProjects.reduce<number>(
				(acc, deletedChildProject) => {
					if (!deletedChildProject) {
						return acc + 1;
					}
					return acc;
				},
				0
			);

			if (numberOfFailedChildProjectDeletions > 0) {
				throw Error(`${numberOfFailedChildProjectDeletions} child projects failed to delete`);
			}

			// If deletion was successful, then redirect to the projects page.
			return redirect(303, '/projects');
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(errMsg);
			return {
				success: false,
				error: `프로젝트를 삭제하는 데에 실패했습니다: ${errMsg}`
			};
		}
	},

	createChildProject: async ({ params, request }) => {
		const rootProjectId = params.rootProjectId;
		const data = await request.formData();

		const name = data.get('name')?.toString() || '';
		const goal = data.get('goal')?.toString() || '';

		try {
			const childProject = await createChildProject({ name, goal, rootProjectId });
			if (!childProject) {
				throw Error('DB 오류가 발생했습니다.');
			}

			return {
				success: true
			};
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(errMsg);
			return {
				success: false,
				error: `세부 프로젝트를 생성하는 데에 실패했습니다: ${errMsg}`
			};
		}
	},

	updateChildProject: async () => {
		// TODO: Implement updateChildProject action
		return;
	},

	deleteChildProject: async () => {
		// TODO: Implement deleteChildProject action
		return;
	},

	createTask: async ({ request }) => {
		const data = await request.formData();

		const childProjectId = data.get('childProjectId')?.toString() || '';
		const description = data.get('description')?.toString() || '';

		try {
			const task = await createTask(childProjectId, description);
			if (!task) {
				throw Error('DB 오류가 발생했습니다.');
			}

			return {
				success: true
			};
		} catch (error) {
			const errMsg = error instanceof Error ? error.message : 'Unknown error';
			console.error(errMsg);
			return {
				success: false,
				error: `작업을 생성하는 데에 실패했습니다: ${errMsg}`
			};
		}
	}
};
