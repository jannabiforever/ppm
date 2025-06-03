import type { RecordId } from 'surrealdb';

function comparePriority(a: App.RootProject, b: App.RootProject): number {
	return priorityToNumber(a.priority) - priorityToNumber(b.priority);
}

function priorityToNumber(priority: App.PriorityLevel): number {
	switch (priority) {
		case 'system':
			return 0;
		case 'high':
			return 1;
		case 'medium':
			return 2;
		case 'low':
			return 3;
	}
}

export function sortByPriority(rootProjects: App.RootProject[]): App.RootProject[] {
	return rootProjects.toSorted(comparePriority);
}

export function recordIdToString(recordId: RecordId): string {
	return recordId.id.toString();
}
