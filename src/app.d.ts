// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		type PriorityLevel = 'high' | 'medium' | 'low' | 'system';

		type RootProject = {
			// ex) 'root_project:{id}'
			id: string;
			name: string;
			goal: string;
			// child project ids.
			childProjects: string[];
			priority: PriorityLevel;
		};

		interface ChildProject {
			// ex) 'child_project:{id}'
			id: string;
			name: string;
			goal: string;
			// root project id.
			rootProject: string;
			// task ids.
			tasks: string[];
		}

		interface Chunk {
			id: string;
			interval: [number, number];
			// child project id.
			childProject: string;
			// task ids.
			tasks: string[];
		}

		interface Task {
			id: string;
			// child project id.
			childProject: string;
			description: string;
			isDone: boolean;
		}
	}
}

export {};
