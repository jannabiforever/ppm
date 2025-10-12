import { Data } from 'effect';

/**
 * Error thrown when a project with the given ID is not found.
 * This can occur during read, update, or delete operations.
 */
export class NotFound extends Data.TaggedError('Project/NotFound')<{
	/**
	 * The ID of the project that was attempted to be accessed
	 */
	projectId: string;
}> {}

/**
 * Error thrown when attempting to create or update a project with a name that already exists.
 * Project names must be unique within a user's projects.
 */
export class NameAlreadyExists extends Data.TaggedError('Project/NameAlreadyExists')<{
	/**
	 * The conflicting project name
	 */
	name: string;
}> {}

/**
 * Error thrown when attempting to delete a project that has dependencies.
 * This occurs when the project is referenced by other resources such as tasks or sessions.
 */
export class HasDependencies extends Data.TaggedError('Project/HasDependencies')<{
	/**
	 * The ID of the project that was attempted to be deleted
	 */
	projectId: string;
}> {}

/**
 * Union type of all possible errors that can occur in the project module.
 * Used for comprehensive error handling in project operations.
 */
export type Error = NotFound | NameAlreadyExists | HasDependencies;
