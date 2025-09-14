import { Data } from 'effect';

/**
 * Error thrown when a user profile cannot be found for an authenticated user.
 * This is a domain error indicating that every user must have an associated profile.
 * This error typically occurs during profile retrieval operations.
 */
export class AssociatedProfileNotFound extends Data.TaggedError('AssociatedProfileNotFound')<{
	/**
	 * The ID of the user whose profile could not be found
	 */
	readonly userId: string;
}> {}

/**
 * Union type of all possible errors that can occur in the user profile module.
 * Used for comprehensive error handling in user profile operations.
 */
export type Error = AssociatedProfileNotFound;
