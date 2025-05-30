// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		type PriorityLevel = 'high' | 'medium' | 'low';
		
		interface RootProject {
			id: string;
			name: string;
			goal: string;
			childProjectIds: string[];
			priority: PriorityLevel;
		}

		interface ChildProject {
			id: string;
			name: string;
			goal: string;
			rootProjectId: string;
			tasks: string[];
		}

		interface Day {
			date: string;
			// [startTime, endTime, Chunk]
			chunks: [number, number, Chunk][];
		}

		interface Chunk {
			childProjectId: string;
			// Aggregated to be one of childProject's tasks.
			tasks: string[];
		}
	}
}

export {};
