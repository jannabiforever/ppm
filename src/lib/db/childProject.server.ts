import { CHILD_PROJECT_TABLE, getDb, ROOT_PROJECT_TABLE } from '$lib/db/db.server';
import { RecordId } from 'surrealdb';
import { recordIdToString } from '$lib/util';

type FetchedChildProject = {
	id: RecordId;
	name: string;
	goal: string;
	rootProjectId: RecordId;
	taskIds: RecordId[];
};

/**
 * Converts a FetchedChildProject to App.ChildProject format by transforming RecordIds to strings
 */
function cast(fetchedChildProject: FetchedChildProject): App.ChildProject {
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

	// Note: Even in case of not found, surrealdb sdk still would return an empty object, and bypass type checking.
	// To prevent this, we can check if the id is undefined.
	if (!fcp.id) {
		return null;
	}

	return cast(fcp);
}

/**
 * Creates a new child project
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
	return await db
		.create<FetchedChildProject, Pick<FetchedChildProject, 'name' | 'goal' | 'rootProjectId'>>(
			CHILD_PROJECT_TABLE,
			{
				name,
				goal,
				rootProjectId: new RecordId(ROOT_PROJECT_TABLE, rootProjectId)
			}
		)
		.then(([p]) => cast(p));
}

/**
 * Deletes a child project
 *
 * @param childProjectId - The ID of the child project to delete
 * @returns A promise that resolves when the child project is deleted
 *
 * @throws May throw database connection errors or deletion errors
 * @logs Logs any errors encountered to the console with error level
 */
export async function deleteChildProject(childProjectId: string): Promise<App.ChildProject | null> {
	const db = await getDb();
	const fetchedChildProject = await db
		.delete<FetchedChildProject>(new RecordId(CHILD_PROJECT_TABLE, childProjectId))
		.then(cast);

	return fetchedChildProject;
}
