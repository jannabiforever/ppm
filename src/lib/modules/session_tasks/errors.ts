import { Data } from 'effect';

/**
 * Error thrown when attempting to add a task to a focus session that already contains it.
 * Each task can only be added once to a specific session to maintain data integrity.
 */
export class TaskAlreadyInSessionError extends Data.TaggedError('TaskAlreadyInSession')<{
	/**
	 * The ID of the task that is already in the session
	 */
	taskId: string;
	/**
	 * The ID of the focus session that already contains the task
	 */
	sessionId: string;
}> {}

/**
 * Error thrown when attempting to remove a task from a focus session that doesn't contain it.
 * This ensures operations are performed on valid session-task associations.
 */
export class TaskNotInSessionError extends Data.TaggedError('TaskNotInSession')<{
	/**
	 * The ID of the task that is not in the session
	 */
	taskId: string;
	/**
	 * The ID of the focus session that doesn't contain the task
	 */
	sessionId: string;
}> {}

/**
 * Union type of all possible errors that can occur in the session-task association module.
 * Used for comprehensive error handling in session-task operations.
 */
export type Error = TaskAlreadyInSessionError | TaskNotInSessionError;
