import { Data } from 'effect';

/**
 * Error thrown when a task with the given ID is not found.
 * This can occur during read, update, or delete operations.
 */
export class NotFound extends Data.TaggedError('Task/NotFound')<{
	/**
	 * The ID of the task that was attempted to be accessed
	 */
	readonly taskId: string;
}> {}

/**
 * Error thrown when attempting to associate a task with a non-existent or inaccessible project.
 * Tasks can only be linked to projects owned by the same user.
 */
export class InvalidProject extends Data.TaggedError('Task/InvalidProject')<{
	/**
	 * The ID of the project that was not found or is inaccessible
	 */
	readonly projectId: string;
}> {}

/**
 * Error thrown when attempting to associate a task with a non-existent or inaccessible session.
 * This typically occurs when marking a task as completed within a specific focus session.
 */
export class InvalidSession extends Data.TaggedError('Task/InvalidSession')<{
	/**
	 * The ID of the session that was not found or is inaccessible
	 */
	readonly sessionId: string;
}> {}

/**
 * Error thrown when attempting to delete a task that has dependencies.
 * This occurs when the task is referenced by other resources and cannot be safely removed.
 */
export class HasDependencies extends Data.TaggedError('Task/HasDependencies')<{
	/**
	 * The ID of the task that was attempted to be deleted
	 */
	readonly taskId: string;
}> {}

/**
 * Union type of all possible errors that can occur in the task module.
 * Used for comprehensive error handling in task operations.
 */
export type Error = NotFound | InvalidProject | InvalidSession | HasDependencies;
