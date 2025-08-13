/* eslint-disable @typescript-eslint/no-unused-vars */
import { Layer, Effect } from 'effect';
import {
	FocusSessionService,
	type FocusSession,
	type SessionTaskDB,
	type FocusSessionWithTasks,
	type Task
} from '../../service.server';
import {
	ActiveFocusSessionExistsError,
	FocusSessionNotFoundError,
	FocusSessionAlreadyEndedError,
	type DomainError,
	type SupabasePostgrestError
} from '$lib/shared/errors';
import type {
	CreateFocusSessionInput,
	UpdateFocusSessionInput,
	StartFocusSessionInput,
	EndFocusSessionInput,
	FocusSessionQueryInput,
	AddTaskToSessionInput,
	RemoveTaskFromSessionInput
} from '../../schema';

// Type for tasks in FocusSessionWithTasks
type FocusSessionTask = Omit<SessionTaskDB, 'task_id' | 'session_id'> & Omit<Task, 'project_id'>;

// Default mock data
export const mockFocusSession: FocusSession = {
	id: 'session_123',
	owner_id: 'user_123',
	project_id: 'project_123',
	started_at: '2024-01-01T10:00:00Z',
	scheduled_end_at: '2024-01-01T10:50:00Z',
	closed_at: null,
	created_at: '2024-01-01T10:00:00Z',
	updated_at: '2024-01-01T10:00:00Z'
};

export const mockSessionTask: SessionTaskDB = {
	session_id: 'session_123',
	task_id: 'task_123',
	added_at: '2024-01-01T10:00:00Z'
};

export const mockFocusSessionWithTasks: FocusSessionWithTasks = {
	...mockFocusSession,
	tasks: [
		{
			added_at: mockSessionTask.added_at,
			id: 'task_123',
			title: 'Mock Task',
			description: 'Mock task description',
			status: 'planned' as const,
			owner_id: 'user_123',
			blocked_note: null,
			planned_for: null,
			created_at: '2024-01-01T09:00:00Z',
			updated_at: '2024-01-01T09:00:00Z'
		}
	]
};

// Mock configurations
export interface MockFocusSessionConfig {
	hasActiveSession?: boolean;
	activeSession?: FocusSession | null;
	sessionNotFound?: boolean;
	sessionAlreadyEnded?: boolean;
	returnedSession?: FocusSession;
	returnedSessions?: FocusSession[];
	returnedSessionWithTasks?: FocusSessionWithTasks | null;
	returnedSessionsWithTasks?: FocusSessionWithTasks[];
	returnedSessionTasks?: SessionTaskDB[];
	returnedSessionTask?: SessionTaskDB;
	shouldFailWith?: SupabasePostgrestError | DomainError;
}

export const createMockFocusSessionService = (config: MockFocusSessionConfig = {}) => {
	const defaultMethods = {
		createFocusSessionAsync: (input: CreateFocusSessionInput) => {
			if (config.shouldFailWith) {
				return Effect.fail(config.shouldFailWith);
			}
			if (config.hasActiveSession) {
				return Effect.fail(new ActiveFocusSessionExistsError());
			}
			const session: FocusSession = {
				...mockFocusSession,
				id: `session_${Date.now()}`,
				project_id: input.project_id || null,
				scheduled_end_at: input.scheduled_end_at,
				started_at: input.started_at || '2024-01-01T10:00:00Z'
			};
			return Effect.succeed(config.returnedSession || session);
		},

		getFocusSessionByIdAsync: (id: string) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			if (config.sessionNotFound) {
				return Effect.succeed(null);
			}
			const session = config.returnedSession || { ...mockFocusSession, id };
			return Effect.succeed(session);
		},

		getFocusSessionWithTasksByIdAsync: (id: string) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			if (config.sessionNotFound) {
				return Effect.succeed(null);
			}
			const sessionWithTasks = config.returnedSessionWithTasks || {
				...mockFocusSessionWithTasks,
				id
			};
			return Effect.succeed(sessionWithTasks);
		},

		getFocusSessionsAsync: (query?: FocusSessionQueryInput) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			return Effect.succeed(config.returnedSessions || [mockFocusSession]);
		},

		getFocusSessionsWithTasksAsync: (query?: FocusSessionQueryInput) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			return Effect.succeed(config.returnedSessionsWithTasks || [mockFocusSessionWithTasks]);
		},

		getActiveFocusSessionAsync: () => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			if (config.hasActiveSession) {
				return Effect.succeed(config.activeSession || mockFocusSession);
			}
			return Effect.succeed(null);
		},

		getActiveFocusSessionWithTasksAsync: () => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			if (config.hasActiveSession) {
				return Effect.succeed(config.returnedSessionWithTasks || mockFocusSessionWithTasks);
			}
			return Effect.succeed(null);
		},

		updateFocusSessionAsync: (id: string, input: UpdateFocusSessionInput) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			const updatedSession = {
				...mockFocusSession,
				id,
				...input,
				updated_at: '2024-01-01T10:00:00Z'
			};
			return Effect.succeed(config.returnedSession || updatedSession);
		},

		startFocusSessionAsync: (input: StartFocusSessionInput) => {
			if (config.shouldFailWith) {
				return Effect.fail(config.shouldFailWith);
			}
			if (config.hasActiveSession) {
				return Effect.fail(new ActiveFocusSessionExistsError());
			}

			const newSession: FocusSession = {
				...mockFocusSession,
				id: `session_${Date.now()}`,
				project_id: input.project_id || null,
				started_at: '2024-01-01T10:00:00Z',
				scheduled_end_at: new Date(
					new Date('2024-01-01T10:00:00Z').getTime() +
						(input.scheduled_duration_minutes || 50) * 60 * 1000
				).toISOString(),
				closed_at: null
			};
			return Effect.succeed(config.returnedSession || newSession);
		},

		endFocusSessionAsync: (sessionId: string, input: EndFocusSessionInput) => {
			if (config.shouldFailWith) {
				return Effect.fail(config.shouldFailWith);
			}
			if (config.sessionNotFound) {
				return Effect.fail(new FocusSessionNotFoundError(sessionId));
			}
			if (config.sessionAlreadyEnded) {
				return Effect.fail(new FocusSessionAlreadyEndedError(sessionId));
			}

			const endedSession: FocusSession = {
				...mockFocusSession,
				id: sessionId,
				closed_at: '2024-01-01T10:45:00Z',
				updated_at: '2024-01-01T10:45:00Z'
			};
			return Effect.succeed(config.returnedSession || endedSession);
		},

		deleteFocusSessionAsync: (id: string) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			return Effect.void;
		},

		addTaskToSessionAsync: (input: AddTaskToSessionInput) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			const sessionTask: SessionTaskDB = {
				...mockSessionTask,
				session_id: input.session_id,
				task_id: input.task_id
			};
			return Effect.succeed(config.returnedSessionTask || sessionTask);
		},

		removeTaskFromSessionAsync: (input: RemoveTaskFromSessionInput) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			return Effect.void;
		},

		getSessionTasksAsync: (sessionId: string) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			const tasks = config.returnedSessionTasks || [{ ...mockSessionTask, session_id: sessionId }];
			return Effect.succeed(tasks);
		},

		getSessionsByTaskIdAsync: (taskId: string) => {
			if (config.shouldFailWith && config.shouldFailWith._tag === 'SupabasePostgrest') {
				return Effect.fail(config.shouldFailWith as SupabasePostgrestError);
			}
			return Effect.succeed(config.returnedSessions || [mockFocusSession]);
		},

		calculateSessionDurationSync: (session: FocusSession) => {
			const start = new Date(session.started_at);
			const end = session.closed_at ? new Date(session.closed_at) : new Date();
			const durationMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
			return Effect.succeed(durationMinutes);
		}
	};

	return Layer.succeed(FocusSessionService, defaultMethods);
};

// Specific mock configurations for common scenarios
export const mockConfigs = {
	// No active session (default state)
	noActiveSession: (): MockFocusSessionConfig => ({
		hasActiveSession: false,
		activeSession: null
	}),

	// Active session exists
	activeSessionExists: (session?: FocusSession): MockFocusSessionConfig => ({
		hasActiveSession: true,
		activeSession: session || mockFocusSession
	}),

	// Session not found
	sessionNotFound: (): MockFocusSessionConfig => ({
		sessionNotFound: true
	}),

	// Session already ended
	sessionAlreadyEnded: (sessionId: string): MockFocusSessionConfig => ({
		sessionAlreadyEnded: true,
		returnedSession: {
			...mockFocusSession,
			id: sessionId,
			closed_at: '2024-01-01T10:45:00Z'
		}
	}),

	// Successful session creation
	successfulSession: (overrides?: Partial<FocusSession>): MockFocusSessionConfig => ({
		returnedSession: {
			...mockFocusSession,
			...overrides
		}
	}),

	// Session with tasks
	sessionWithTasks: (tasks?: FocusSessionTask[]): MockFocusSessionConfig => ({
		returnedSessionWithTasks: {
			...mockFocusSession,
			tasks: tasks || [mockFocusSessionWithTasks.tasks[0]]
		},
		returnedSessionTasks: [mockSessionTask]
	}),

	// Multiple sessions
	multipleSessions: (sessions?: FocusSession[]): MockFocusSessionConfig => ({
		returnedSessions: sessions || [mockFocusSession, { ...mockFocusSession, id: 'session_456' }]
	})
};

// Factory functions for creating mock data
export const createMockSession = (overrides: Partial<FocusSession> = {}): FocusSession => ({
	...mockFocusSession,
	...overrides
});

export const createMockSessionTask = (overrides: Partial<SessionTaskDB> = {}): SessionTaskDB => ({
	...mockSessionTask,
	...overrides
});

export const createMockSessionWithTasks = (
	sessionOverrides: Partial<FocusSession> = {},
	tasks: FocusSessionTask[] = [mockFocusSessionWithTasks.tasks[0]]
): FocusSessionWithTasks => ({
	...mockFocusSession,
	...sessionOverrides,
	tasks: tasks
});

// Error simulation helpers
export const createFailingFocusSessionService = (error: SupabasePostgrestError | DomainError) => {
	return createMockFocusSessionService({
		shouldFailWith: error
	});
};
