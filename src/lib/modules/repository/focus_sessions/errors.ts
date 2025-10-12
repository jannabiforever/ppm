import { Data } from 'effect';

/**
 * Error thrown when attempting to create a new active focus session while one already exists.
 * Only one focus session can be active at any given time to maintain focus integrity.
 */
export class ActiveOneAlreadyExists extends Data.TaggedError(
	'FocusSession/ActiveOneAlreadyExists'
)<{
	/**
	 * The ID of the currently active focus session
	 */
	readonly currentSessionId: string;
	/**
	 * The timestamp when the current active session is scheduled to end
	 */
	readonly endsAt: string;
}> {}

/**
 * Error thrown when a focus session with the specified ID cannot be found.
 * This can occur during read, update, or delete operations.
 */
export class NotFound extends Data.TaggedError('FocusSession/NotFound')<{
	/**
	 * The ID of the focus session that was attempted to be accessed
	 */
	readonly sessionId: string;
}> {}

/**
 * Error thrown when an operation requires an active focus session but the session is not active.
 * A session is considered active when the current time is between its start and end times.
 */
export class NotActive extends Data.TaggedError('FocusSession/NotActive')<{
	/**
	 * The ID of the focus session that is not active
	 */
	readonly sessionId: string;
}> {}

/**
 * Error thrown when attempting to perform an operation on a focus session that has already ended.
 * This prevents modifications to completed sessions to maintain data integrity.
 */
export class AlreadyEnded extends Data.TaggedError('FocusSession/AlreadyEnded')<{
	/**
	 * The ID of the focus session that has already ended
	 */
	readonly sessionId: string;
	/**
	 * The timestamp when the session ended
	 */
	readonly endedAt: string;
}> {}

/**
 * Error thrown when attempting to create or update a focus session with a time range that conflicts with existing sessions.
 * Sessions cannot overlap to ensure clear focus boundaries.
 */
export class TimeConflict extends Data.TaggedError('FocusSession/TimeConflict')<{
	/**
	 * The requested start time that conflicts with existing sessions
	 */
	readonly requestedStart: string;
	/**
	 * The requested end time that conflicts with existing sessions
	 */
	readonly requestedEnd: string;
}> {}

/**
 * Error thrown when attempting to access or modify a focus session that belongs to another user.
 * Users can only access and modify their own focus sessions.
 */
export class NotOwned extends Data.TaggedError('FocusSession/NotOwned')<{
	/**
	 * The ID of the focus session that is not owned by the current user
	 */
	readonly sessionId: string;
}> {}

/**
 * Error thrown when a focus session has an invalid duration.
 * This ensures sessions have reasonable time limits for effective focus management.
 */
export class InvalidDuration extends Data.TaggedError('FocusSession/InvalidDuration')<{
	/**
	 * The invalid duration value in minutes
	 */
	readonly duration: number;
}> {}

/**
 * Error thrown when a focus session's start time is after its end time.
 * This is enforced by a database constraint to ensure temporal validity.
 */
export class InvalidTime extends Data.TaggedError('FocusSession/InvalidTime')<{
	/**
	 * The invalid start time that is after the end time
	 */
	readonly start_at: string;
	/**
	 * The end time that is before the start time
	 */
	readonly end_at: string;
}> {}

/**
 * Error thrown when attempting to associate a focus session with a non-existent or inaccessible project.
 * Sessions can only be linked to projects owned by the same user.
 */
export class InvalidProject extends Data.TaggedError('FocusSession/InvalidProject')<{
	/**
	 * The ID of the invalid or non-existent project
	 */
	projectId: string;
}> {}

/**
 * Error thrown when attempting to delete a focus session that has dependent resources.
 * This occurs when the session is referenced by other entities such as completed tasks.
 */
export class HasDependencies extends Data.TaggedError('FocusSession/HasDependencies')<{
	/**
	 * The ID of the focus session that has dependencies
	 */
	sessionId: string;
}> {}

/**
 * Union type of all possible errors that can occur in the focus session module.
 * Used for comprehensive error handling in focus session operations.
 */
export type Error =
	| ActiveOneAlreadyExists
	| AlreadyEnded
	| HasDependencies
	| InvalidDuration
	| InvalidProject
	| InvalidTime
	| NotActive
	| NotFound
	| NotOwned
	| TimeConflict;
