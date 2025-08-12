import type { Tables } from '$lib/infra/supabase/types';
import type { StartFocusSessionInput, EndFocusSessionInput } from '../../schema';
import {
	mockTasks,
	mockSessions,
	mockRegularProject,
	baseTestTime
} from '../mocks/session-fixtures';

// Business Scenario Test Data
export const businessScenarios = {
	// Scenario 1: Multi-task session with mixed completion states
	multiTaskSession: {
		startInput: {
			task_ids: [mockTasks.backlogTask.id, mockTasks.plannedTask.id, mockTasks.taskToBlock.id],
			scheduled_duration_minutes: 50,
			project_id: mockRegularProject.id
		} satisfies StartFocusSessionInput,

		endInput: {
			task_completion_updates: [
				{
					task_id: mockTasks.backlogTask.id,
					completed: true,
					seconds_spent: 1800 // 30 minutes
				},
				{
					task_id: mockTasks.plannedTask.id,
					completed: false,
					seconds_spent: 900 // 15 minutes, but not completed
				},
				{
					task_id: mockTasks.taskToBlock.id,
					completed: false,
					seconds_spent: 300 // 5 minutes before blocking issue found
				}
			]
		} satisfies EndFocusSessionInput,

		expectedTaskStates: {
			[mockTasks.backlogTask.id]: 'completed',
			[mockTasks.plannedTask.id]: 'planned', // Back to planned since not completed
			[mockTasks.taskToBlock.id]: 'planned' // Could be set to blocked via separate update
		}
	},

	// Scenario 2: Single task session from inbox to project
	inboxToProjectSession: {
		startInput: {
			task_ids: [mockTasks.inboxTask.id],
			scheduled_duration_minutes: 45
		} satisfies StartFocusSessionInput,

		endInput: {
			task_completion_updates: [
				{
					task_id: mockTasks.inboxTask.id,
					completed: true,
					seconds_spent: 2700 // Full 45 minutes
				}
			]
		} satisfies EndFocusSessionInput,

		expectedTaskStates: {
			[mockTasks.inboxTask.id]: 'completed'
		}
	},

	// Scenario 3: Emergency early session closure
	emergencyCloseSession: {
		startInput: {
			task_ids: [mockTasks.plannedTask.id],
			scheduled_duration_minutes: 50
		} satisfies StartFocusSessionInput,

		// Session closed at 45 minutes instead of scheduled 50 minutes
		endInput: {
			task_completion_updates: [
				{
					task_id: mockTasks.plannedTask.id,
					completed: false,
					seconds_spent: 2700 // 45 minutes
				}
			]
		} satisfies EndFocusSessionInput,

		expectedSessionDuration: 45, // minutes
		expectedTaskStates: {
			[mockTasks.plannedTask.id]: 'planned'
		}
	},

	// Scenario 4: Empty session (should be allowed but nudged in UI)
	emptySession: {
		startInput: {
			scheduled_duration_minutes: 30
		} satisfies StartFocusSessionInput,

		endInput: {} satisfies EndFocusSessionInput,

		expectedTaskStates: {} // No tasks to update
	},

	// Scenario 5: Session with no task completions (all back to backlog)
	noCompletionSession: {
		startInput: {
			task_ids: [mockTasks.backlogTask.id, mockTasks.plannedTask.id],
			scheduled_duration_minutes: 25
		} satisfies StartFocusSessionInput,

		endInput: {
			task_completion_updates: [
				{
					task_id: mockTasks.backlogTask.id,
					completed: false,
					seconds_spent: 600 // 10 minutes
				},
				{
					task_id: mockTasks.plannedTask.id,
					completed: false,
					seconds_spent: 900 // 15 minutes
				}
			]
		} satisfies EndFocusSessionInput,

		expectedTaskStates: {
			[mockTasks.backlogTask.id]: 'planned',
			[mockTasks.plannedTask.id]: 'planned'
		}
	}
};

// Error scenarios for testing business rule violations
export const errorScenarios = {
	// Attempt to start session when one is already active
	activeSessionExists: {
		existingSession: mockSessions.standardSession,
		newSessionInput: {
			task_ids: [mockTasks.inboxTask.id],
			scheduled_duration_minutes: 30
		} satisfies StartFocusSessionInput,
		expectedError: 'ActiveFocusSessionExistsError'
	},

	// Attempt to end session that doesn't exist
	sessionNotFound: {
		sessionId: 'nonexistent_session_id',
		endInput: {} satisfies EndFocusSessionInput,
		expectedError: 'FocusSessionNotFoundError'
	},

	// Attempt to end already ended session
	sessionAlreadyEnded: {
		session: mockSessions.earlyClosedSession, // Already has closed_at
		endInput: {} satisfies EndFocusSessionInput,
		expectedError: 'FocusSessionAlreadyEndedError'
	}
};

// Test data factories for creating variations
export const createTestSession = (
	overrides: Partial<Tables<'focus_sessions'>> = {}
): Tables<'focus_sessions'> => {
	const base = { ...mockSessions.standardSession };
	return {
		...base,
		project_id: overrides.project_id !== undefined ? overrides.project_id : base.project_id,
		...overrides
	};
};

export const createTestTask = (overrides: Partial<Tables<'tasks'>> = {}): Tables<'tasks'> => ({
	id: 'test_task_id',
	owner_id: 'user_123',
	title: 'Test Task',
	description: null,
	project_id: mockRegularProject.id,
	status: 'backlog',
	planned_for: null,
	blocked_note: null,
	created_at: baseTestTime,
	updated_at: baseTestTime,
	...overrides
});

export const createSessionTask = (
	overrides: Partial<Tables<'session_tasks'>> = {}
): Tables<'session_tasks'> => ({
	session_id: mockSessions.standardSession.id,
	task_id: mockTasks.backlogTask.id,
	order_index: 1,
	seconds_spent: 0,
	created_at: baseTestTime,
	updated_at: baseTestTime,
	...overrides
});

// Validation helpers for tests
export const validators = {
	isValidSessionDuration: (session: Tables<'focus_sessions'>): boolean => {
		if (!session.closed_at) return true; // Active sessions are always valid
		return new Date(session.closed_at) <= new Date(session.scheduled_end_at);
	},

	calculateSessionDuration: (session: Tables<'focus_sessions'>): number => {
		const start = new Date(session.started_at);
		const end = session.closed_at ? new Date(session.closed_at) : new Date();
		return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
	},

	isValidTaskStatusTransition: (from: string, to: string): boolean => {
		const validTransitions: Record<string, string[]> = {
			backlog: ['planned', 'blocked'],
			planned: ['in_session', 'blocked', 'completed'],
			in_session: ['planned', 'blocked', 'completed'],
			blocked: ['planned', 'backlog'],
			completed: ['planned', 'backlog']
		};
		return validTransitions[from]?.includes(to) ?? false;
	}
};
