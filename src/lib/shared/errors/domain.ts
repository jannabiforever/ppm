// Import and re-export errors from individual modules
export * from '$lib/modules/focus_session/errors';
export * from '$lib/modules/task/errors';
export * from '$lib/modules/project/errors';

// Import user profile error from schema
export { UserProfileNotFoundError } from '$lib/modules/user_profile/schema';

// Import types for union type
import type {
	ActiveFocusSessionExistsError,
	FocusSessionNotFoundError,
	FocusSessionAlreadyEndedError
} from '$lib/modules/focus_session/errors';

import type {
	TaskNotFoundError,
	InvalidTaskStatusTransitionError,
	TaskInSessionError
} from '$lib/modules/task/errors';

import type { ProjectNotFoundError, ProjectHasTasksError } from '$lib/modules/project/errors';

import type { UserProfileNotFoundError } from '$lib/modules/user_profile/schema';

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
	| ProjectHasTasksError
	| UserProfileNotFoundError;
