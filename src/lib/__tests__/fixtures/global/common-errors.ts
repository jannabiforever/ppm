import { SupabasePostgrestError } from '$lib/shared/errors';

// Common database errors for testing
export const databaseErrors = {
	connectionTimeout: new Error('Connection timeout'),
	connectionRefused: new Error('Connection refused'),
	networkError: new Error('Network error'),
	serverError: new Error('Internal server error'),

	// Supabase specific errors
	supabaseConnectionTimeout: new SupabasePostgrestError({
		message: 'Connection timeout',
		status: 408,
		code: 'CONNECTION_TIMEOUT'
	}),
	supabaseNetworkError: new SupabasePostgrestError({
		message: 'Network error',
		status: 503,
		code: 'NETWORK_ERROR'
	}),
	supabaseServerError: new SupabasePostgrestError({
		message: 'Internal server error',
		status: 500,
		code: 'INTERNAL_ERROR'
	}),
	supabaseRateLimited: new SupabasePostgrestError({
		message: 'Rate limit exceeded',
		status: 429,
		code: 'RATE_LIMITED'
	}),

	// Constraint violations
	uniqueConstraintViolation: new SupabasePostgrestError({
		message: 'Unique constraint violation',
		status: 409,
		code: 'UNIQUE_VIOLATION'
	}),
	foreignKeyViolation: new SupabasePostgrestError({
		message: 'Foreign key constraint violation',
		status: 409,
		code: 'FOREIGN_KEY_VIOLATION'
	}),
	checkConstraintViolation: new SupabasePostgrestError({
		message: 'Check constraint violation',
		status: 400,
		code: 'CHECK_VIOLATION'
	}),
	notNullViolation: new SupabasePostgrestError({
		message: 'Not null constraint violation',
		status: 400,
		code: 'NOT_NULL_VIOLATION'
	}),

	// Authentication errors
	authenticationFailed: new SupabasePostgrestError({
		message: 'Authentication failed',
		status: 401,
		code: 'AUTH_FAILED'
	}),
	insufficientPrivileges: new SupabasePostgrestError({
		message: 'Insufficient privileges',
		status: 403,
		code: 'INSUFFICIENT_PRIVILEGES'
	}),
	tokenExpired: new SupabasePostgrestError({
		message: 'Token expired',
		status: 401,
		code: 'TOKEN_EXPIRED'
	}),
	invalidCredentials: new SupabasePostgrestError({
		message: 'Invalid credentials',
		status: 401,
		code: 'INVALID_CREDENTIALS'
	})
};

// Business logic errors for testing
export const businessLogicErrors = {
	activeFocusSessionExists: {
		_tag: 'ActiveFocusSessionExistsError' as const,
		message: 'An active focus session already exists',
		details: { activeSessionId: 'session_123' }
	},

	focusSessionNotFound: {
		_tag: 'FocusSessionNotFoundError' as const,
		message: 'Focus session not found',
		details: { sessionId: 'session_404' }
	},

	focusSessionAlreadyEnded: {
		_tag: 'FocusSessionAlreadyEndedError' as const,
		message: 'Focus session has already ended',
		details: { sessionId: 'session_ended', endedAt: '2024-01-01T10:45:00Z' }
	},

	invalidTaskStatusTransition: {
		_tag: 'InvalidTaskStatusTransitionError' as const,
		message: 'Invalid task status transition from completed to in_session',
		details: {
			currentStatus: 'completed',
			newStatus: 'in_session',
			allowedTransitions: ['planned', 'backlog']
		}
	},

	taskNotFound: {
		_tag: 'TaskNotFoundError' as const,
		message: 'Task not found',
		details: { taskId: 'task_404' }
	},

	projectNotFound: {
		_tag: 'ProjectNotFoundError' as const,
		message: 'Project not found',
		details: { projectId: 'project_404' }
	},

	projectHasTasks: {
		_tag: 'ProjectHasTasksError' as const,
		message: 'Cannot delete project with existing tasks',
		details: { projectId: 'project_123', taskCount: 5 }
	},

	userNotAuthorized: {
		_tag: 'UserNotAuthorizedError' as const,
		message: 'User not authorized to perform this action',
		details: { userId: 'user_123', action: 'delete_session' }
	}
};

// Validation errors for testing
export const validationErrors = {
	schemaValidation: {
		title: 'Schema validation failed',
		message: 'Invalid input data',
		details: {
			field: 'title',
			constraint: 'minLength',
			expected: 1,
			actual: 0
		}
	},

	titleTooLong: {
		title: 'Title too long',
		message: 'Title exceeds maximum length of 200 characters',
		details: {
			field: 'title',
			maxLength: 200,
			actualLength: 250
		}
	},

	titleRequired: {
		title: 'Title required',
		message: 'Title is required',
		details: {
			field: 'title',
			constraint: 'required'
		}
	},

	invalidTaskStatus: {
		title: 'Invalid task status',
		message: 'Task status must be one of: backlog, planned, in_session, blocked, completed',
		details: {
			field: 'status',
			providedValue: 'invalid_status',
			allowedValues: ['backlog', 'planned', 'in_session', 'blocked', 'completed']
		}
	},

	invalidDateFormat: {
		title: 'Invalid date format',
		message: 'Date must be in ISO 8601 format',
		details: {
			field: 'scheduled_end_at',
			providedValue: '2024-01-01 10:00:00',
			expectedFormat: 'YYYY-MM-DDTHH:mm:ss.sssZ'
		}
	},

	pastScheduledEndDate: {
		title: 'Scheduled end date in past',
		message: 'Scheduled end date must be in the future',
		details: {
			field: 'scheduled_end_at',
			providedValue: '2023-01-01T10:00:00Z',
			currentTime: '2024-01-01T10:00:00Z'
		}
	}
};

// Error factory functions for creating dynamic errors
export const createError = {
	databaseError: (message: string) =>
		new SupabasePostgrestError({ message, status: 500, code: 'DATABASE_ERROR' }),

	businessLogicError: (tag: string, message: string, details?: Record<string, unknown>) => ({
		_tag: tag,
		message,
		details: details || {}
	}),

	validationError: (field: string, constraint: string, details?: Record<string, unknown>) => ({
		title: `Validation failed for ${field}`,
		message: `Field ${field} failed ${constraint} validation`,
		details: {
			field,
			constraint,
			...details
		}
	}),

	notFoundError: (entity: string, id: string) => ({
		_tag: `${entity}NotFoundError`,
		message: `${entity} not found`,
		details: { [`${entity.toLowerCase()}Id`]: id }
	}),

	permissionError: (userId: string, action: string, resource?: string) => ({
		_tag: 'PermissionError',
		message: `User ${userId} not authorized to ${action}${resource ? ` ${resource}` : ''}`,
		details: { userId, action, resource }
	})
};

// Error scenarios for complex testing
export const errorScenarios = {
	// Cascading failures
	cascadingFailure: [
		databaseErrors.connectionTimeout,
		businessLogicErrors.focusSessionNotFound,
		validationErrors.titleRequired
	],

	// Partial failures in batch operations
	partialBatchFailure: {
		successful: [
			{ id: 'item_1', status: 'success' },
			{ id: 'item_3', status: 'success' }
		],
		failed: [
			{ id: 'item_2', error: businessLogicErrors.taskNotFound },
			{ id: 'item_4', error: validationErrors.titleTooLong }
		]
	},

	// Concurrent operation conflicts
	concurrencyConflict: {
		operation1: businessLogicErrors.activeFocusSessionExists,
		operation2: businessLogicErrors.focusSessionAlreadyEnded
	},

	// Transaction rollback scenarios
	transactionRollback: {
		step1Success: { id: 'session_123', created: true },
		step2Failure: businessLogicErrors.invalidTaskStatusTransition,
		rollbackResult: { sessionsCreated: 0, tasksUpdated: 0 }
	}
};

// Helper function to simulate random errors for chaos testing
export const getRandomError = () => {
	const allErrors = [
		...Object.values(databaseErrors),
		...Object.values(businessLogicErrors),
		...Object.values(validationErrors)
	];

	return allErrors[Math.floor(Math.random() * allErrors.length)];
};

// Error matching utilities for tests
export const errorMatchers = {
	isDatabaseError: (error: unknown): error is SupabasePostgrestError => {
		return error instanceof SupabasePostgrestError;
	},

	isBusinessLogicError: (error: unknown): boolean => {
		return typeof error === 'object' && error !== null && '_tag' in error;
	},

	isValidationError: (error: unknown): boolean => {
		return (
			typeof error === 'object' &&
			error !== null &&
			'title' in error &&
			'details' in error &&
			typeof error.details === 'object' &&
			error.details !== null &&
			'constraint' in error.details
		);
	},

	hasErrorTag: (error: unknown, tag: string): boolean => {
		return typeof error === 'object' && error !== null && '_tag' in error && error._tag === tag;
	},

	hasErrorMessage: (error: unknown, message: string): boolean => {
		return (
			typeof error === 'object' &&
			error !== null &&
			'message' in error &&
			typeof error.message === 'string' &&
			error.message.includes(message)
		);
	}
};
