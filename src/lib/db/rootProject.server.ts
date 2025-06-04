import { getDb, replaceData, ROOT_PROJECT_TABLE } from '$lib/db/db.server';
import { recordIdToString } from '$lib/util';
import { RecordId } from 'surrealdb';

type FetchedRootProject = {
	id: RecordId;
	name: string;
	goal: string;
	childProjectIds: RecordId[];
	priority: App.PriorityLevel;
};

function isEveryFieldSet(fetchedRootProject: FetchedRootProject): boolean {
	return (
		fetchedRootProject.id !== undefined &&
		fetchedRootProject.name !== undefined &&
		fetchedRootProject.goal !== undefined &&
		fetchedRootProject.childProjectIds !== undefined &&
		fetchedRootProject.priority !== undefined
	);
}

/**
 * Converts a SurrealDB root project record to the application model format.
 *
 * @param fetchedRootProject - The root project data from SurrealDB
 * @returns Converted App.RootProject object
 */
function cast(fetchedRootProject: FetchedRootProject): App.RootProject | null {
	// Note: Even in case of not found, surrealdb sdk still would return an empty object, and bypass type checking.
	// To prevent this, we can check if the id is undefined.
	if (!isEveryFieldSet(fetchedRootProject)) {
		return null;
	}

	return {
		id: recordIdToString(fetchedRootProject.id),
		name: fetchedRootProject.name,
		goal: fetchedRootProject.goal,
		childProjectIds: fetchedRootProject.childProjectIds.map(recordIdToString),
		priority: fetchedRootProject.priority
	};
}

/**
 * Select all root projects from the database.
 *
 * Possible errors include:
 * - Database connection issues.
 * - SurrealDB query errors.
 *
 * @remarks Logs errors to console and returns empty array on failure.
 * @returns Promise with an array of root projects, or empty array on error
 */
export async function selectAllRootProjects(): Promise<App.RootProject[]> {
	const db = await getDb();
	return await db
		.select<FetchedRootProject>(ROOT_PROJECT_TABLE)
		.then((fetchedRootProjects) =>
			fetchedRootProjects.map(cast).filter((project) => project !== null)
		);
}

/**
 * Select a root project by its id.
 *
 * Possible errors include:
 * - Database connection issues.
 * - SurrealDB query errors (rarely occurs).
 * - Not found error will cause cast to fail.
 *
 * @remarks Logs errors to console and rethrows the error.
 * @param rootProjectId - The ID of the root project to select (e.g., "0vjzdzhaut2u2ptpo9vi")
 * @returns Promise with the root project if found, or null
 * @throws Will rethrow any encountered errors
 */
export async function selectRootProjectWithId(
	rootProjectId: string
): Promise<App.RootProject | null> {
	const db = await getDb();
	return await db
		.select<FetchedRootProject>(new RecordId(ROOT_PROJECT_TABLE, rootProjectId))
		.then(cast);
}

/**
 * Create a new root project in the database.
 *
 * Possible errors include:
 * - Database connection issues.
 * - SurrealDB creation errors.
 * - Database setup incomplete.
 *
 * @remarks Logs errors to console and returns null on failure.
 * @param options - Object containing name, goal, and priority for the new root project
 * @returns Promise with the created root project, or null on error
 */
export async function createRootProject({
	name,
	goal,
	priority
}: {
	name: string;
	goal: string;
	priority: App.PriorityLevel;
}): Promise<App.RootProject | null> {
	const db = await getDb();
	const rootProject = await db
		.create<FetchedRootProject, Pick<FetchedRootProject, 'name' | 'goal' | 'priority'>>(
			ROOT_PROJECT_TABLE,
			{
				name,
				goal,
				priority
			}
		)
		.then(([p]) => p);

	return cast(rootProject);
}

/**
 * Update a root project's data in the database.
 *
 * Possible errors include:
 * - Database connection issues.
 * - SurrealDB update errors.
 * - Project not found.
 * - Invalid payload properties.
 *
 * @remarks Logs errors to console and returns null on failure.
 * @param rootProjectId - The ID of the root project to update (e.g., "0vjzdzhaut2u2ptpo9vi")
 * @param payload - Object containing the fields to update
 * @returns Promise with the updated root project, or null on error
 */
export async function updateRootProject<P extends Partial<FetchedRootProject>>(
	rootProjectId: string,
	payload: P
): Promise<App.RootProject | null> {
	const db = await getDb();
	return await replaceData<FetchedRootProject, P>(
		db,
		new RecordId(ROOT_PROJECT_TABLE, rootProjectId),
		payload
	).then((p) => (p ? cast(p) : null));
}

/**
 * Delete a root project from the database.
 *
 * Possible errors include:
 * - Database connection issues.
 * - SurrealDB deletion errors.
 * - Project not found.
 * - Referential integrity constraints (if implemented).
 *
 * @remarks Logs errors to console and returns null on failure.
 * @param rootProjectId - The ID of the root project to delete (e.g., "0vjzdzhaut2u2ptpo9vi")
 * @returns Promise with the deleted root project, or null on error
 */
export async function deleteRootProject(rootProjectId: string): Promise<App.RootProject | null> {
	const db = await getDb();
	return await db
		.delete<FetchedRootProject>(new RecordId(ROOT_PROJECT_TABLE, rootProjectId))
		.then(cast);
}
