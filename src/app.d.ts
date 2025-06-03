// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		type PriorityLevel = 'high' | 'medium' | 'low' | 'system';

		type RootProject = {
			// ex) RecordId fetched from surrealdb would look like 'root_project:{id}'.
			id: string;
			name: string;
			goal: string;
			// child project ids.
			childProjectIds: string[];
			priority: PriorityLevel;
		};

		interface ChildProject {
			// ex) RecordId fetched from surrealdb would look like 'child_project:{id}'.
			id: string;
			name: string;
			goal: string;
			// ex) RecordId fetched from surrealdb would look like 'root_project:{id}'.
			rootProjectId: string;
			taskIds: string[];
		}

		interface Chunk {
			id: string;
			interval: [number, number];
			// child project id.
			childProjectId: string;
			// task ids.
			taskIds: string[];
		}

		interface Task {
			id: string;
			childProjectId: string;
			description: string;
			isDone: boolean;
		}
	}
}

export {};
