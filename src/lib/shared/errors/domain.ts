import { Data } from 'effect';

/**
 * Focus session related domain errors
 */
export class ActiveFocusSessionExistsError extends Data.TaggedError('ActiveFocusSessionExists')<{
	readonly message: string;
}> {}

export class FocusSessionNotFoundError extends Data.TaggedError('FocusSessionNotFound')<{
	readonly message: string;
}> {}

export class FocusSessionAlreadyEndedError extends Data.TaggedError('FocusSessionAlreadyEnded')<{
	readonly message: string;
}> {}

/**
 * Task related domain errors
 */
export class TaskNotFoundError extends Data.TaggedError('TaskNotFound')<{
	readonly message: string;
}> {}

export class InvalidTaskStatusTransitionError extends Data.TaggedError('InvalidTaskStatusTransition')<{
	readonly message: string;
	readonly currentStatus: string;
	readonly targetStatus: string;
}> {}

export class TaskInSessionError extends Data.TaggedError('TaskInSession')<{
	readonly message: string;
	readonly taskId: string;
}> {}

/**
 * Project related domain errors
 */
export class ProjectNotFoundError extends Data.TaggedError('ProjectNotFound')<{
	readonly message: string;
}> {}

export class ProjectHasTasksError extends Data.TaggedError('ProjectHasTasks')<{
	readonly message: string;
	readonly taskCount: number;
}> {}

/**
 * Union type for all domain errors
 */
export type DomainError =
	| ActiveFocusSessionExistsError
	| FocusSessionNotFoundError
	| FocusSessionAlreadyEndedError
	| TaskNotFoundError
	| InvalidTaskStatusTransitionError
	| TaskInSessionError
	| ProjectNotFoundError
	| ProjectHasTasksError;

/**
 * Helper functions to create domain errors
 */
export const createActiveFocusSessionExistsError = () =>
	new ActiveFocusSessionExistsError({ message: 'An active focus session already exists. Please end the current session before starting a new one.' });

export const createFocusSessionNotFoundError = (sessionId: string) =>
	new FocusSessionNotFoundError({ message: `Focus session with ID ${sessionId} not found.` });

export const createFocusSessionAlreadyEndedError = (sessionId: string) =>
	new FocusSessionAlreadyEndedError({ message: `Focus session with ID ${sessionId} has already ended.` });

export const createTaskNotFoundError = (taskId: string) =>
	new TaskNotFoundError({ message: `Task with ID ${taskId} not found.` });

export const createInvalidTaskStatusTransitionError = (currentStatus: string, targetStatus: string) =>
	new InvalidTaskStatusTransitionError({
		message: `Cannot transition task from ${currentStatus} to ${targetStatus}.`,
		currentStatus,
		targetStatus
	});

export const createTaskInSessionError = (taskId: string) =>
	new TaskInSessionError({
		message: `Task ${taskId} is currently in an active focus session.`,
		taskId
	});

export const createProjectNotFoundError = (projectId: string) =>
	new ProjectNotFoundError({ message: `Project with ID ${projectId} not found.` });

export const createProjectHasTasksError = (taskCount: number) =>
	new ProjectHasTasksError({
		message: `Cannot delete project because it contains ${taskCount} task(s). Please move or delete tasks first.`,
		taskCount
	});
