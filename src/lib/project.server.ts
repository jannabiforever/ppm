import { RecordId, StringRecordId } from 'surrealdb';
import { getDb } from './db.server';
import { sortByPriority } from './util';

type FetchedRootProject = {
	id: RecordId;
	name: string;
	goal: string;
	// child project names.
	childProjects: string[];
	priority: App.PriorityLevel;
};

function castToRootProject(project: FetchedRootProject): App.RootProject {
	return {
		id: project.id.toString(),
		name: project.name,
		goal: project.goal,
		childProjects: project.childProjects,
		priority: project.priority
	};
}

type FetchedChildProject = {
	id: RecordId;
	name: string;
	goal: string;
	// root project name.
	rootProject: string;
	// task ids.
	tasks: string[];
};

function castToChildProject(project: FetchedChildProject): App.ChildProject {
	return {
		id: project.id.toString(),
		name: project.name,
		goal: project.goal,
		rootProject: project.rootProject,
		tasks: project.tasks
	};
}

export async function getAllRootProjects(): Promise<App.RootProject[]> {
	try {
		const db = await getDb();
		const rootProjects = await db.select<FetchedRootProject>('root_project');
		return sortByPriority(rootProjects.map(castToRootProject));
	} catch (error) {
		console.error('Error fetching root projects:', error);
		return [];
	}
}

export async function getRootProject(rootProjectId: string): Promise<App.RootProject | null> {
	try {
		const db = await getDb();
		const rootProjectRecordId = rootProjectId.startsWith('root_project')
			? new StringRecordId(rootProjectId)
			: new RecordId('root_project', rootProjectId);

		const rootProject = await db.select<FetchedRootProject>(rootProjectRecordId);
		return rootProject ? castToRootProject(rootProject) : null;
	} catch (error) {
		console.error('Error fetching root project:', error);
		return null;
	}
}

export async function createRootProject(
	project: Omit<App.RootProject, 'id' | 'childProjects'>
): Promise<App.RootProject> {
	try {
		const db = await getDb();
		// @ts-expect-error I don't know why this throws an error, but works fine.
		const rootProject = await db.create<FetchedRootProject>('root_project', {
			name: project.name,
			goal: project.goal,
			priority: project.priority
		});
		return castToRootProject(rootProject);
	} catch (error) {
		console.error('Error creating root project:', error);
		throw error;
	}
}

export async function getAllChildProjectsFromRoot(
	rootProjectId: string
): Promise<App.ChildProject[]> {
	try {
		const db = await getDb();
		const rootProject = await db.select<FetchedRootProject>(new StringRecordId(rootProjectId));

		const childProjectPromises = rootProject.childProjects.map((childProjectId) => {
			return db.select<FetchedChildProject>(new StringRecordId(childProjectId));
		});

		const childProjects = await Promise.all(childProjectPromises);
		return childProjects.map(castToChildProject);
	} catch (error) {
		console.error('Error fetching child projects:', error);
		return [];
	}
}

export async function updateRootProject(
	rootProjectId: string,
	data: {
		name: string;
		goal: string;
		priority: App.PriorityLevel;
	}
): Promise<App.RootProject | null> {
	try {
		const db = await getDb();
		const rootProjectRecordId = rootProjectId.startsWith('root_project')
			? new StringRecordId(rootProjectId)
			: new RecordId('root_project', rootProjectId);

		const updatedRootProject = await db.update<FetchedRootProject>(rootProjectRecordId, {
			name: data.name,
			goal: data.goal,
			priority: data.priority
		});

		return updatedRootProject ? castToRootProject(updatedRootProject) : null;
	} catch (error) {
		console.error('Error updating root project:', error);
		throw error;
	}
}

export async function deleteRootProject(rootProjectId: string): Promise<boolean> {
	try {
		const db = await getDb();
		const rootProjectRecordId = rootProjectId.startsWith('root_project')
			? new StringRecordId(rootProjectId)
			: new RecordId('root_project', rootProjectId);

		// Get child projects to delete them as well
		const rootProject = await getRootProject(rootProjectId);
		if (rootProject && rootProject.childProjects.length > 0) {
			// Delete all child projects
			for (const childProjectId of rootProject.childProjects) {
				await deleteChildProject(childProjectId);
			}
		}

		// Delete the root project
		await db.delete(rootProjectRecordId);
		return true;
	} catch (error) {
		console.error('Error deleting root project:', error);
		throw error;
	}
}

export async function createChildProject(
	rootProjectId: string,
	data: {
		name: string;
		goal: string;
	}
): Promise<App.ChildProject | null> {
	try {
		const db = await getDb();

		// Create the child project
		const childProject = await db.create<FetchedChildProject>('child_project', {
			name: data.name,
			goal: data.goal,
			rootProject: rootProjectId,
			tasks: []
		});

		// Add the child project to the root project's list
		const rootProjectRecordId = rootProjectId.startsWith('root_project')
			? new StringRecordId(rootProjectId)
			: new RecordId('root_project', rootProjectId);

		const rootProject = await db.select<FetchedRootProject>(rootProjectRecordId);
		if (rootProject) {
			const childProjects = [...rootProject.childProjects, childProject.id.toString()];
			await db.update(rootProjectRecordId, { childProjects });
		}

		return castToChildProject(childProject);
	} catch (error) {
		console.error('Error creating child project:', error);
		throw error;
	}
}

export async function updateChildProject(
	childProjectId: string,
	data: {
		name: string;
		goal: string;
	}
): Promise<App.ChildProject | null> {
	try {
		const db = await getDb();
		const childProjectRecordId = childProjectId.startsWith('child_project')
			? new StringRecordId(childProjectId)
			: new RecordId('child_project', childProjectId);

		const updatedChildProject = await db.update<FetchedChildProject>(childProjectRecordId, {
			name: data.name,
			goal: data.goal
		});

		return updatedChildProject ? castToChildProject(updatedChildProject) : null;
	} catch (error) {
		console.error('Error updating child project:', error);
		throw error;
	}
}

export async function deleteChildProject(childProjectId: string): Promise<boolean> {
	try {
		const db = await getDb();
		const childProjectRecordId = childProjectId.startsWith('child_project')
			? new StringRecordId(childProjectId)
			: new RecordId('child_project', childProjectId);

		// Get the child project to find its root project
		const childProject = await db.select<FetchedChildProject>(childProjectRecordId);

		if (childProject) {
			const rootProjectId = childProject.rootProject;

			// Remove the child project from the root project's list
			const rootProjectRecordId = rootProjectId.startsWith('root_project')
				? new StringRecordId(rootProjectId)
				: new RecordId('root_project', rootProjectId);

			const rootProject = await db.select<FetchedRootProject>(rootProjectRecordId);
			if (rootProject) {
				const updatedChildProjects = rootProject.childProjects.filter(
					(id) => id !== childProjectId
				);
				await db.update(rootProjectRecordId, { childProjects: updatedChildProjects });
			}
		}

		// Delete the child project
		await db.delete(childProjectRecordId);
		return true;
	} catch (error) {
		console.error('Error deleting child project:', error);
		throw error;
	}
}
