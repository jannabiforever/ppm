import { Data } from 'effect';

/**
 * Task related domain errors
 */
export class TaskNotFoundError extends Data.TaggedError('TaskNotFound')<{
	readonly message: string;
	readonly taskId?: string;
}> {
	constructor(taskId: string) {
		super({
			message: `Task with ID ${taskId} not found.`,
			taskId
		});
	}
}

export class InvalidTaskStatusTransitionError extends Data.TaggedError(
	'InvalidTaskStatusTransition'
)<{
	readonly message: string;
	readonly currentStatus: string;
	readonly targetStatus: string;
}> {
	constructor(currentStatus: string, targetStatus: string) {
		super({
			message: `Cannot transition task from ${currentStatus} to ${targetStatus}.`,
			currentStatus,
			targetStatus
		});
	}
}

export class TaskInSessionError extends Data.TaggedError('TaskInSession')<{
	readonly message: string;
	readonly taskId: string;
}> {
	constructor(taskId: string) {
		super({
			message: `Task ${taskId} is currently in an active focus session.`,
			taskId
		});
	}
}
