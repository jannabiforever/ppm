import type { Tables } from '$lib/infra/supabase/types';
import type {
	CreateFocusSessionInput,
	UpdateFocusSessionInput,
	StartFocusSessionInput,
	EndFocusSessionInput,
	AddTaskToSessionInput,
	RemoveTaskFromSessionInput,
	UpdateSessionTaskInput,
	ReorderSessionTasksInput
} from '../../schema';

// Base test data
export const baseTestDate = '2024-01-01T10:00:00Z';
export const baseTestEndDate = '2024-01-01T10:50:00Z';

// Mock Focus Session Data
export const mockFocusSession: Tables<'focus_sessions'> = {
	id: 'session_123',
	owner_id: 'user_123',
	project_id: 'project_123',
	started_at: baseTestDate,
	scheduled_end_at: baseTestEndDate,
	closed_at: null,
	created_at: baseTestDate,
	updated_at: baseTestDate
};

export const mockActiveFocusSession: Tables<'focus_sessions'> = {
	...mockFocusSession,
	closed_at: null
};

export const mockCompletedFocusSession: Tables<'focus_sessions'> = {
	...mockFocusSession,
	closed_at: '2024-01-01T10:45:00Z'
};

// Mock Session Task Data
export const mockSessionTask: Tables<'session_tasks'> = {
	session_id: 'session_123',
	task_id: 'task_123',
	order_index: 1,
	seconds_spent: 1800, // 30 minutes
	created_at: baseTestDate,
	updated_at: baseTestDate
};

export const mockSessionTasks: Tables<'session_tasks'>[] = [
	{
		session_id: 'session_123',
		task_id: 'task_123',
		order_index: 1,
		seconds_spent: 1200,
		created_at: baseTestDate,
		updated_at: baseTestDate
	},
	{
		session_id: 'session_123',
		task_id: 'task_456',
		order_index: 2,
		seconds_spent: 600,
		created_at: baseTestDate,
		updated_at: baseTestDate
	}
];

// Valid Schema Input Data
export const validCreateFocusSessionInput: CreateFocusSessionInput = {
	project_id: 'project_123',
	started_at: baseTestDate,
	scheduled_end_at: baseTestEndDate,
	task_ids: ['task_123', 'task_456']
};

export const validCreateFocusSessionInputMinimal: CreateFocusSessionInput = {
	started_at: baseTestDate,
	scheduled_end_at: baseTestEndDate
};

export const validUpdateFocusSessionInput: UpdateFocusSessionInput = {
	project_id: 'project_456',
	scheduled_end_at: '2024-01-01T11:00:00Z'
};

export const validStartFocusSessionInput: StartFocusSessionInput = {
	task_ids: ['task_123', 'task_456'],
	scheduled_duration_minutes: 50,
	project_id: 'project_123'
};

export const validStartFocusSessionInputMinimal: StartFocusSessionInput = {};

export const validEndFocusSessionInput: EndFocusSessionInput = {
	task_completion_updates: [
		{
			task_id: 'task_123',
			completed: true,
			seconds_spent: 1800
		},
		{
			task_id: 'task_456',
			completed: false,
			seconds_spent: 600
		}
	]
};

export const validEndFocusSessionInputMinimal: EndFocusSessionInput = {};

export const validAddTaskToSessionInput: AddTaskToSessionInput = {
	session_id: 'session_123',
	task_id: 'task_789',
	order_index: 3
};

export const validRemoveTaskFromSessionInput: RemoveTaskFromSessionInput = {
	session_id: 'session_123',
	task_id: 'task_123'
};

export const validUpdateSessionTaskInput: UpdateSessionTaskInput = {
	session_id: 'session_123',
	task_id: 'task_123',
	order_index: 2,
	seconds_spent: 2400
};

export const validReorderSessionTasksInput: ReorderSessionTasksInput = {
	session_id: 'session_123',
	task_order: [
		{ task_id: 'task_456', order_index: 1 },
		{ task_id: 'task_123', order_index: 2 },
		{ task_id: 'task_789', order_index: 3 }
	]
};

// Invalid Schema Input Data
export const invalidCreateFocusSessionInputs = {
	missingRequiredFields: {},
	invalidStartedAt: {
		started_at: 'invalid-date',
		scheduled_end_at: baseTestEndDate
	},
	invalidScheduledEndAt: {
		started_at: baseTestDate,
		scheduled_end_at: 'not-a-date'
	},
	scheduledEndBeforeStart: {
		started_at: baseTestDate,
		scheduled_end_at: '2023-12-31T10:00:00Z' // Before started_at
	},
	invalidTaskIds: {
		started_at: baseTestDate,
		scheduled_end_at: baseTestEndDate,
		task_ids: ['', null, undefined] as unknown[]
	},
	emptyTaskIds: {
		started_at: baseTestDate,
		scheduled_end_at: baseTestEndDate,
		task_ids: []
	}
};

export const invalidStartFocusSessionInputs = {
	invalidTaskIds: {
		task_ids: [123, null, ''] as unknown[]
	},
	negativeDuration: {
		scheduled_duration_minutes: -30
	},
	zeroDuration: {
		scheduled_duration_minutes: 0
	},
	nonIntegerDuration: {
		scheduled_duration_minutes: 45.5
	}
};

export const invalidEndFocusSessionInputs = {
	invalidTaskCompletionUpdates: {
		task_completion_updates: [
			{
				task_id: '', // Empty task_id
				completed: true
			}
		]
	},
	invalidSecondsSpent: {
		task_completion_updates: [
			{
				task_id: 'task_123',
				completed: true,
				seconds_spent: -100 // Negative seconds
			}
		]
	},
	nonIntegerSecondsSpent: {
		task_completion_updates: [
			{
				task_id: 'task_123',
				completed: true,
				seconds_spent: 45.5 // Non-integer
			}
		]
	}
};

export const invalidAddTaskToSessionInputs = {
	missingSessionId: {
		task_id: 'task_123'
	},
	missingTaskId: {
		session_id: 'session_123'
	},
	emptySessionId: {
		session_id: '',
		task_id: 'task_123'
	},
	emptyTaskId: {
		session_id: 'session_123',
		task_id: ''
	},
	negativeOrderIndex: {
		session_id: 'session_123',
		task_id: 'task_123',
		order_index: -1
	},
	nonIntegerOrderIndex: {
		session_id: 'session_123',
		task_id: 'task_123',
		order_index: 1.5
	}
};

export const invalidUpdateSessionTaskInputs = {
	missingRequired: {
		order_index: 1
	},
	emptyIds: {
		session_id: '',
		task_id: '',
		order_index: 1
	},
	negativeValues: {
		session_id: 'session_123',
		task_id: 'task_123',
		order_index: -1,
		seconds_spent: -100
	},
	nonIntegerValues: {
		session_id: 'session_123',
		task_id: 'task_123',
		order_index: 1.5,
		seconds_spent: 45.7
	}
};

export const invalidReorderSessionTasksInputs = {
	missingSessionId: {
		task_order: []
	},
	emptySessionId: {
		session_id: '',
		task_order: []
	},
	invalidTaskOrder: {
		session_id: 'session_123',
		task_order: [
			{ task_id: '', order_index: 1 }, // Empty task_id
			{ task_id: 'task_123', order_index: -1 } // Negative order_index
		]
	},
	duplicateOrderIndex: {
		session_id: 'session_123',
		task_order: [
			{ task_id: 'task_123', order_index: 1 },
			{ task_id: 'task_456', order_index: 1 } // Duplicate order_index
		]
	}
};

// Factory functions for creating test data
export const createMockFocusSession = (
	overrides: Partial<Tables<'focus_sessions'>> = {}
): Tables<'focus_sessions'> => ({
	...mockFocusSession,
	...overrides
});

export const createMockSessionTask = (
	overrides: Partial<Tables<'session_tasks'>> = {}
): Tables<'session_tasks'> => ({
	...mockSessionTask,
	...overrides
});

export const createValidCreateInput = (
	overrides: Partial<CreateFocusSessionInput> = {}
): CreateFocusSessionInput => ({
	...validCreateFocusSessionInput,
	...overrides
});

export const createValidStartInput = (
	overrides: Partial<StartFocusSessionInput> = {}
): StartFocusSessionInput => ({
	...validStartFocusSessionInput,
	...overrides
});

export const createValidEndInput = (
	overrides: Partial<EndFocusSessionInput> = {}
): EndFocusSessionInput => ({
	...validEndFocusSessionInput,
	...overrides
});

// Test scenarios for complex validation
export const testScenarios = {
	// Time validation scenarios
	timeValidation: {
		validFutureSchedule: {
			started_at: '2024-01-01T10:00:00Z',
			scheduled_end_at: '2024-01-01T11:00:00Z'
		},
		invalidPastSchedule: {
			started_at: '2024-01-01T10:00:00Z',
			scheduled_end_at: '2024-01-01T09:00:00Z' // Before start
		},
		sameTime: {
			started_at: '2024-01-01T10:00:00Z',
			scheduled_end_at: '2024-01-01T10:00:00Z' // Same as start
		}
	},

	// Task management scenarios
	taskManagement: {
		singleTask: {
			task_ids: ['task_123']
		},
		multipleTasks: {
			task_ids: ['task_123', 'task_456', 'task_789']
		},
		noTasks: {
			task_ids: undefined
		},
		emptyTasksArray: {
			task_ids: []
		}
	},

	// Session completion scenarios
	sessionCompletion: {
		allTasksCompleted: {
			task_completion_updates: [
				{ task_id: 'task_123', completed: true, seconds_spent: 1800 },
				{ task_id: 'task_456', completed: true, seconds_spent: 1200 }
			]
		},
		partialCompletion: {
			task_completion_updates: [
				{ task_id: 'task_123', completed: true, seconds_spent: 1800 },
				{ task_id: 'task_456', completed: false, seconds_spent: 600 }
			]
		},
		noTasksCompleted: {
			task_completion_updates: [
				{ task_id: 'task_123', completed: false, seconds_spent: 300 },
				{ task_id: 'task_456', completed: false, seconds_spent: 200 }
			]
		}
	}
};

// Boundary test cases
export const boundaryTestCases = {
	// String length boundaries
	strings: {
		empty: '',
		single: 'a',
		normal: 'Test Session',
		long: 'a'.repeat(1000),
		maxLength: 'a'.repeat(255)
	},

	// Numeric boundaries
	numbers: {
		zero: 0,
		one: 1,
		negative: -1,
		large: 999999,
		decimal: 45.5
	},

	// Array boundaries
	arrays: {
		empty: [],
		single: ['item'],
		multiple: ['item1', 'item2', 'item3'],
		large: Array.from({ length: 100 }, (_, i) => `item_${i}`)
	}
};
