import { Data } from 'effect';

/**
 * Project related domain errors
 */
export class ProjectNotFoundError extends Data.TaggedError('ProjectNotFound')<{
	readonly message: string;
	readonly projectId?: string;
}> {
	constructor(projectId: string) {
		super({
			message: `Project with ID ${projectId} not found.`,
			projectId
		});
	}
}

export class ProjectHasTasksError extends Data.TaggedError('ProjectHasTasks')<{
	readonly message: string;
	readonly taskCount: number;
}> {
	constructor(taskCount: number) {
		super({
			message: `Cannot delete project because it contains ${taskCount} task(s). Please move or delete tasks first.`,
			taskCount
		});
	}
}
