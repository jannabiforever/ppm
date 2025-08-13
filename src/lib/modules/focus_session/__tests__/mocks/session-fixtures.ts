import type { Tables } from '$lib/infra/supabase/types';
import type { StartFocusSessionInput, EndFocusSessionInput } from '../../schema';

// Base test timestamps
export const baseTestTime = '2024-01-01T10:00:00Z';
export const scheduledEndTime = '2024-01-01T10:50:00Z'; // 50 minutes later
export const actualEndTime = '2024-01-01T10:45:00Z'; // 5 minutes early (emergency close)
export const overtimeEndTime = '2024-01-01T11:00:00Z'; // Invalid: exceeds scheduled time

// Mock Users
export const mockUser = {
	id: 'user_123',
	email: 'test@example.com'
};

// Mock Projects
export const mockInboxProject = null; // Inbox is represented as null project_id
export const mockRegularProject: Tables<'projects'> = {
	id: 'project_123',
	name: 'Test Project',
	owner_id: mockUser.id,
	description: 'A test project for focus sessions',
	active: true,
	created_at: baseTestTime,
	updated_at: baseTestTime
};

// Mock Tasks with different scenarios
export const mockTasks = {
	// Task that starts in backlog, should become in_session, then completed
	backlogTask: {
		id: 'task_backlog_123',
		title: 'Backlog Task',
		owner_id: mockUser.id,
		project_id: mockRegularProject.id,
		status: 'backlog' as const,
		description: 'Task starting from backlog',
		planned_for: null,
		blocked_note: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	},

	// Task that starts planned, should become in_session, then stay planned
	plannedTask: {
		id: 'task_planned_456',
		title: 'Planned Task',
		owner_id: mockUser.id,
		project_id: mockRegularProject.id,
		status: 'planned' as const,
		description: 'Task starting from planned',
		planned_for: null,
		blocked_note: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	},

	// Task in inbox that should be moved during session
	inboxTask: {
		id: 'task_inbox_789',
		title: 'Inbox Task',
		owner_id: mockUser.id,
		project_id: null, // Inbox
		status: 'backlog' as const,
		description: 'Task in inbox collection',
		planned_for: null,
		blocked_note: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	},

	// Task that will be blocked during session
	taskToBlock: {
		id: 'task_block_101',
		title: 'Task to Block',
		owner_id: mockUser.id,
		project_id: mockRegularProject.id,
		status: 'planned' as const,
		description: 'Task that will encounter blocking issues',
		planned_for: null,
		blocked_note: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	}
};

// Mock Focus Sessions
export const mockSessions = {
	// Standard session with scheduled end time
	standardSession: {
		id: 'session_standard_123',
		owner_id: mockUser.id,
		project_id: mockRegularProject.id,
		started_at: baseTestTime,
		scheduled_end_at: scheduledEndTime,
		closed_at: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	},

	// Completed session that ended early (emergency close)
	earlyClosedSession: {
		id: 'session_early_456',
		owner_id: mockUser.id,
		project_id: mockRegularProject.id,
		started_at: baseTestTime,
		scheduled_end_at: scheduledEndTime,
		closed_at: actualEndTime, // 5 minutes early
		created_at: baseTestTime,
		updated_at: actualEndTime
	},

	// Empty session (no tasks)
	emptySession: {
		id: 'session_empty_789',
		owner_id: mockUser.id,
		project_id: null,
		started_at: baseTestTime,
		scheduled_end_at: scheduledEndTime,
		closed_at: null,
		created_at: baseTestTime,
		updated_at: baseTestTime
	}
};

// Mock Session-Task relationships
export const mockSessionTasks = {
	// Standard session tasks with time tracking
	standardSessionTasks: [
		{
			session_id: mockSessions.standardSession.id,
			task_id: mockTasks.backlogTask.id,
			added_at: baseTestTime
		},
		{
			session_id: mockSessions.standardSession.id,
			task_id: mockTasks.plannedTask.id,
			added_at: baseTestTime
		}
	],

	// Single task session
	singleTaskSession: [
		{
			session_id: mockSessions.earlyClosedSession.id,
			task_id: mockTasks.inboxTask.id,
			added_at: baseTestTime
		}
	]
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
	owner_id: mockUser.id,
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
	added_at: baseTestTime,
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
					completed: true
				},
				{
					task_id: mockTasks.plannedTask.id,
					completed: false
				},
				{
					task_id: mockTasks.taskToBlock.id,
					completed: false
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
					completed: true
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
					completed: false
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
					completed: false
				},
				{
					task_id: mockTasks.plannedTask.id,
					completed: false
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
	},

	// Attempt to exceed scheduled end time (business rule violation)
	scheduleTimeViolation: {
		session: mockSessions.standardSession,
		invalidEndTime: overtimeEndTime, // After scheduled_end_at
		expectedError: 'ScheduledTimeExceededError' // This might need to be implemented
	}
};
