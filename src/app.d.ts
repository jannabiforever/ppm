// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		type PriorityLevel = 'high' | 'medium' | 'low' | 'system';

		type RootProject = {
			id: string;
			name: string;
			goal: string;
			// child project names.
			childProjects: string[];
			priority: PriorityLevel;
		};

		interface ChildProject {
			id: string;
			name: string;
			goal: string;
			// root project name.
			rootProject: string;
			// task ids.
			tasks: string[];
		}

		interface Chunk {
			id: string;
			interval: [number, number];
			// child project name.
			childProject: string;
			// task ids.
			tasks: string[];
		}

		interface Task {
			id: string;
			// child project name.
			childProject: string;
			description: string;
			isDone: boolean;
		}
	}
}

export {};
