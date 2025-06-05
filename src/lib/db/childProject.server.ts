import { CHILD_PROJECT_TABLE, getDb, ROOT_PROJECT_TABLE } from '$lib/db/db.server';
import { PreparedQuery, RecordId } from 'surrealdb';
import { recordIdToString } from '$lib/util';

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
	return await db
		.select<FetchedChildProject>(new RecordId(CHILD_PROJECT_TABLE, childProjectId))
		.then(cast);
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
	const query = new PreparedQuery(
		`
	BEGIN TRANSACTION;
    LET $childProject = CREATE type::table($table) CONTENT {
        name: $name,
        goal: $goal,
        rootProjectId: $rootProjectId
    };

    UPDATE $rootProjectId SET childProjectIds += $childProject.id;
    RETURN $childProject;
  COMMIT TRANSACTION;
	`,
		{
			table: CHILD_PROJECT_TABLE,
			rootProjectId: new RecordId(ROOT_PROJECT_TABLE, rootProjectId),
			name,
			goal
		}
	);

	return await db.query<[FetchedChildProject]>(query).then(([childProject]) => cast(childProject));
}

/**
 * Deletes a child project and remove this from its root project.
 *
 * @param childProjectId - The ID of the child project to delete
 * @returns A promise that resolves when the child project is deleted
 *
 * @throws May throw database connection errors or deletion errors
 */
export async function deleteChildProject(childProjectId: string): Promise<App.ChildProject | null> {
	const db = await getDb();
	const query = new PreparedQuery(
		`
  BEGIN TRANSACTION;
    LET $childProject = (SELECT * FROM $childProjectRecordId)[0];
    FOR $taskId IN $childProject.taskIds {
			DELETE $taskId;
    };
    DELETE $childProjectRecordId RETURN BEFORE;
    UPDATE $childProject.rootProjectId SET childProjectIds -= $childProjectRecordId;
    RETURN $childProject;
  COMMIT TRANSACTION;
	`,
		{
			childProjectRecordId: new RecordId(CHILD_PROJECT_TABLE, childProjectId)
		}
	);

	return await db.query<[FetchedChildProject]>(query).then(([childProject]) => cast(childProject));
}
