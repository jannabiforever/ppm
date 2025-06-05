import { addData, CHILD_PROJECT_TABLE, getDb, ROOT_PROJECT_TABLE } from '$lib/db/db.server';
import { RecordId } from 'surrealdb';
import { recordIdToString } from '$lib/util';
import { type FetchedRootProject } from './rootProject.server';

export type FetchedChildProject = {
	id: RecordId;
	name: string;
	goal: string;
	rootProjectId: RecordId;
	taskIds: RecordId[];
};

function isEveryFieldSet(fetchedChildProject: FetchedChildProject): boolean {
	return (
		fetchedChildProject.id !== undefined &&
		fetchedChildProject.name !== undefined &&
		fetchedChildProject.goal !== undefined &&
		fetchedChildProject.rootProjectId !== undefined &&
		fetchedChildProject.taskIds !== undefined
	);
}

/**
 * Converts a FetchedChildProject to App.ChildProject format by transforming RecordIds to strings
 */
function cast(fetchedChildProject: FetchedChildProject): App.ChildProject | null {
	if (!isEveryFieldSet(fetchedChildProject)) {
		return null;
	}

	return {
		id: recordIdToString(fetchedChildProject.id),
		name: fetchedChildProject.name,
		goal: fetchedChildProject.goal,
		rootProjectId: recordIdToString(fetchedChildProject.rootProjectId),
		taskIds: fetchedChildProject.taskIds.map(recordIdToString)
	};
}

/**
 * Retrieves a child project by its ID
 *
 * @param childProjectId - The ID of the child project to retrieve
 * @returns The child project if found, null otherwise
 *
 * @throws May throw database connection errors or query execution errors
 * @logs Logs any errors encountered to the console
 */
export async function selectChildProjectWithId(
	childProjectId: string
): Promise<App.ChildProject | null> {
	const db = await getDb();
	const fcp: FetchedChildProject = await db.select<FetchedChildProject>(
		new RecordId(CHILD_PROJECT_TABLE, childProjectId)
	);

	return cast(fcp);
}

/**
 * Creates a new child project and register it to the root project.
 *
 * @param options - Object containing the new child project properties
 * @param options.name - The name of the child project
 * @param options.goal - The goal of the child project
 * @param options.rootProjectId - The ID of the root project this child project belongs to
 * @returns The created child project if successful, null otherwise
 *
 * @throws May throw database connection errors, validation errors, or creation errors
 * @logs Logs any errors encountered to the console with error level
 */
export async function createChildProject({
	name,
	goal,
	rootProjectId
}: {
	name: string;
	goal: string;
	rootProjectId: string;
}): Promise<App.ChildProject | null> {
	const db = await getDb();
	const childProject = await db
		.create<FetchedChildProject, Pick<FetchedChildProject, 'name' | 'goal' | 'rootProjectId'>>(
			CHILD_PROJECT_TABLE,
			{
				name,
				goal,
				rootProjectId: new RecordId(ROOT_PROJECT_TABLE, rootProjectId)
			}
		)
		.then(([p]) => cast(p));

	if (childProject === null) {
		return null;
	}

	// Register the child project to the root project.
	await addData<FetchedRootProject>(db, new RecordId(ROOT_PROJECT_TABLE, rootProjectId), {
		childProjectIds: [new RecordId(CHILD_PROJECT_TABLE, childProject.id)]
	});

	return childProject;
}

/**
 * Deletes a child project
 *
 * @param childProjectId - The ID of the child project to delete
 * @returns A promise that resolves when the child project is deleted
 *
 * @throws May throw database connection errors or deletion errors
 */
export async function deleteChildProject(childProjectId: string): Promise<App.ChildProject | null> {
	const db = await getDb();
	const fetchedChildProject = await db
		.delete<FetchedChildProject>(new RecordId(CHILD_PROJECT_TABLE, childProjectId))
		.then(cast);

	return fetchedChildProject;
}
