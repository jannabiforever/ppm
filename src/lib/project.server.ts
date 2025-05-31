import { RecordId } from 'surrealdb';
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
	rootProjectName: string
): Promise<App.ChildProject[]> {
	try {
		const db = await getDb();
		const rootProject = await db.select<FetchedRootProject>(
			new RecordId('root_project', rootProjectName)
		);

		const childProjectPromises = rootProject.childProjects.map((childProjectName) => {
			return db.select<FetchedChildProject>(new RecordId('child_project', childProjectName));
		});

		const childProjects = await Promise.all(childProjectPromises);
		return childProjects.map(castToChildProject);
	} catch (error) {
		console.error('Error fetching child projects:', error);
		return [];
	}
}
