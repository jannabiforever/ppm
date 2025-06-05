import { RecordId } from 'surrealdb';
import { addData, CHILD_PROJECT_TABLE, getDb, TASK_TABLE } from './db.server';
import { recordIdToString } from '$lib/util';
import type { FetchedChildProject } from './childProject.server';

export type FetchedTask = {
	id: RecordId;
	childProjectId: RecordId;
	description: string;
	isDone: boolean;
};

function isEveryFieldSet(task: FetchedTask): boolean {
	return (
		task.id !== undefined &&
		task.childProjectId !== undefined &&
		task.description !== undefined &&
		task.isDone !== undefined
	);
}

function cast(task: FetchedTask): App.Task | null {
	if (!isEveryFieldSet(task)) return null;

	return {
		id: recordIdToString(task.id),
		childProjectId: recordIdToString(task.childProjectId),
		description: task.description,
		isDone: task.isDone
	};
}

export async function createTask(
	childProjectId: string,
	description: string
): Promise<App.Task | null> {
	const db = await getDb();
	const task = await db
		.create<FetchedTask, Pick<FetchedTask, 'childProjectId' | 'description'>>(TASK_TABLE, {
			childProjectId: new RecordId(CHILD_PROJECT_TABLE, childProjectId),
			description
		})
		.then(([p]) => cast(p));

	if (!task) return null;

	await addData<FetchedChildProject>(db, new RecordId(CHILD_PROJECT_TABLE, childProjectId), {
		taskIds: [new RecordId(TASK_TABLE, task.id)]
	});

	return task;
}

export async function selectTaskById(taskId: string): Promise<App.Task | null> {
	const db = await getDb();
	const task = await db.select<FetchedTask>(new RecordId(TASK_TABLE, taskId)).then(cast);

	return task;
}

export async function selectTasksByIds(taskIds: string[]): Promise<App.Task[]> {
	if (taskIds.length === 0) return [];

	const db = await getDb();
	const tasks = await Promise.all(
		taskIds.map((taskId) =>
			db.select<FetchedTask>(new RecordId(TASK_TABLE, taskId)).then((t) => cast(t))
		)
	);

	// Filter out null values
	return tasks.filter((task): task is App.Task => task !== null);
}
