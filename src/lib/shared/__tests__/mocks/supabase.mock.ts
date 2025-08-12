import { Layer, Effect } from 'effect';
import { vi } from 'vitest';
import { SupabaseService } from '$lib/infra/supabase/layer.server';

import type { Tables } from '$lib/infra/supabase/types';

// Mock Supabase client configuration
export interface MockSupabaseConfig {
	insertResult?: unknown;
	selectResult?: unknown;
	updateResult?: unknown;
	deleteResult?: unknown;
	shouldFail?: boolean;
	error?: Error;
	customResponses?: Record<string, unknown>;
}

// Create a mock Supabase client
export const createMockSupabaseClient = (config: MockSupabaseConfig = {}) => {
	const mockResponse = (data: unknown) => ({
		data: config.shouldFail ? null : data,
		error: config.shouldFail ? config.error : null,
		count: config.shouldFail ? null : Array.isArray(data) ? data.length : 1,
		status: config.shouldFail ? 400 : 200,
		statusText: config.shouldFail ? 'Bad Request' : 'OK'
	});

	const createQueryBuilder = (tableName: string, operation: string, defaultResult?: unknown) => {
		const result = defaultResult || config.customResponses?.[`${tableName}_${operation}`] || {};

		const queryBuilder = {
			select: vi.fn().mockReturnThis(),
			insert: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			neq: vi.fn().mockReturnThis(),
			gt: vi.fn().mockReturnThis(),
			gte: vi.fn().mockReturnThis(),
			lt: vi.fn().mockReturnThis(),
			lte: vi.fn().mockReturnThis(),
			like: vi.fn().mockReturnThis(),
			ilike: vi.fn().mockReturnThis(),
			is: vi.fn().mockReturnThis(),
			in: vi.fn().mockReturnThis(),
			not: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			and: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			limit: vi.fn().mockReturnThis(),
			range: vi.fn().mockReturnThis(),
			single: vi.fn(() => Promise.resolve(mockResponse(result))),
			maybeSingle: vi.fn(() => Promise.resolve(mockResponse(result))),
			then: vi.fn((resolve) => resolve(mockResponse(result)))
		};

		return queryBuilder;
	};

	return {
		from: vi.fn((tableName: string) => {
			const defaultResults = {
				focus_sessions: config.selectResult || config.insertResult || config.updateResult,
				session_tasks: config.selectResult || config.insertResult || config.updateResult,
				tasks: config.selectResult || config.insertResult || config.updateResult,
				projects: config.selectResult || config.insertResult || config.updateResult
			};

			return createQueryBuilder(
				tableName,
				'query',
				defaultResults[tableName as keyof typeof defaultResults]
			);
		}),
		auth: {
			getSession: vi.fn(() => Promise.resolve(mockResponse({ session: null }))),
			getUser: vi.fn(() => Promise.resolve(mockResponse({ user: null }))),
			signInWithPassword: vi.fn(() => Promise.resolve(mockResponse({ user: null, session: null }))),
			signOut: vi.fn(() => Promise.resolve(mockResponse({})))
		},
		channel: vi.fn(() => ({
			on: vi.fn().mockReturnThis(),
			subscribe: vi.fn()
		}))
	};
};

// Create mock SupabaseService Layer
export const createMockSupabaseService = (config: MockSupabaseConfig = {}) => {
	const mockClient = createMockSupabaseClient(config);

	return Layer.succeed(SupabaseService, {
		getClientSync: () => Effect.succeed(mockClient as never),
		safeGetSessionAsync: () => {
			return Effect.succeed({
				session: null,
				user: null
			});
		}
	});
};

// Specific mock configurations for common scenarios
export const mockConfigs = {
	// Successful operations
	successfulInsert: (data: unknown): MockSupabaseConfig => ({
		insertResult: data,
		shouldFail: false
	}),

	successfulSelect: (data: unknown): MockSupabaseConfig => ({
		selectResult: data,
		shouldFail: false
	}),

	successfulUpdate: (data: unknown): MockSupabaseConfig => ({
		updateResult: data,
		shouldFail: false
	}),

	successfulDelete: (): MockSupabaseConfig => ({
		deleteResult: {},
		shouldFail: false
	}),

	// Error scenarios
	databaseError: (message = 'Database error'): MockSupabaseConfig => ({
		shouldFail: true,
		error: new Error(message)
	}),

	connectionTimeout: (): MockSupabaseConfig => ({
		shouldFail: true,
		error: new Error('Connection timeout')
	}),

	constraintViolation: (): MockSupabaseConfig => ({
		shouldFail: true,
		error: new Error('Unique constraint violation')
	}),

	// Table-specific mocks
	focusSessionMocks: {
		activeSession: (sessionData: Partial<Tables<'focus_sessions'>>): MockSupabaseConfig => ({
			selectResult: {
				id: 'session_123',
				owner_id: 'user_123',
				project_id: null,
				started_at: '2024-01-01T10:00:00Z',
				scheduled_end_at: '2024-01-01T10:50:00Z',
				closed_at: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z',
				...sessionData
			}
		}),

		noActiveSession: (): MockSupabaseConfig => ({
			selectResult: null
		}),

		sessionWithTasks: (
			sessionData: Partial<Tables<'focus_sessions'>>,
			tasks: Tables<'session_tasks'>[]
		): MockSupabaseConfig => ({
			customResponses: {
				focus_sessions_query: {
					id: 'session_123',
					owner_id: 'user_123',
					project_id: null,
					started_at: '2024-01-01T10:00:00Z',
					scheduled_end_at: '2024-01-01T10:50:00Z',
					closed_at: null,
					created_at: '2024-01-01T10:00:00Z',
					updated_at: '2024-01-01T10:00:00Z',
					...sessionData
				},
				session_tasks_query: tasks
			}
		})
	},

	taskMocks: {
		validTask: (taskData: Partial<Tables<'tasks'>>): MockSupabaseConfig => ({
			selectResult: {
				id: 'task_123',
				owner_id: 'user_123',
				title: 'Test Task',
				description: null,
				project_id: null,
				status: 'backlog' as const,
				planned_for: null,
				blocked_note: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z',
				...taskData
			}
		}),

		taskNotFound: (): MockSupabaseConfig => ({
			selectResult: null
		})
	}
};

// Helper to create batch mock responses for multiple operations
export const createBatchMockSupabase = () => {
	return Layer.succeed(SupabaseService, {
		getClientSync: () => {
			// Return a client that switches behavior based on the operation
			const compositeClient = createMockSupabaseClient();
			return Effect.succeed(compositeClient as never);
		},
		safeGetSessionAsync: () => Effect.succeed({ session: null, user: null })
	});
};

// Reset all mocks - useful in beforeEach
export const resetSupabaseMocks = () => {
	vi.clearAllMocks();
};
