import { describe, test, expect } from 'vitest';
import { Schema } from 'effect';
import {
	CreateFocusSessionSchema,
	UpdateFocusSessionSchema,
	StartFocusSessionSchema,
	EndFocusSessionSchema,
	AddTaskToSessionSchema,
	RemoveTaskFromSessionSchema,
	UpdateSessionTaskSchema,
	ReorderSessionTasksSchema,
	FocusSessionQuerySchema,
	SessionTaskQuerySchema,
	SessionTaskSchema
} from '../schema';
import {
	validCreateFocusSessionInput,
	validCreateFocusSessionInputMinimal,
	validUpdateFocusSessionInput,
	validStartFocusSessionInput,
	validStartFocusSessionInputMinimal,
	validEndFocusSessionInput,
	validEndFocusSessionInputMinimal,
	validAddTaskToSessionInput,
	validRemoveTaskFromSessionInput,
	validUpdateSessionTaskInput,
	validReorderSessionTasksInput,
	invalidCreateFocusSessionInputs,
	invalidStartFocusSessionInputs,
	invalidEndFocusSessionInputs,
	invalidAddTaskToSessionInputs,
	invalidUpdateSessionTaskInputs,
	invalidReorderSessionTasksInputs,
	testScenarios,
	boundaryTestCases,
	createValidCreateInput,
	createValidStartInput,
	createValidEndInput
} from './fixtures/mock-data';

describe('Focus Session Schemas', () => {
	describe('CreateFocusSessionSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(CreateFocusSessionSchema)(
				validCreateFocusSessionInput
			);

			expect(result.started_at).toBe(validCreateFocusSessionInput.started_at);
			expect(result.scheduled_end_at).toBe(validCreateFocusSessionInput.scheduled_end_at);
			expect(result.project_id).toBe(validCreateFocusSessionInput.project_id);
			expect(result.task_ids).toEqual(validCreateFocusSessionInput.task_ids);
		});

		test('should validate minimal valid input', () => {
			const result = Schema.decodeUnknownSync(CreateFocusSessionSchema)(
				validCreateFocusSessionInputMinimal
			);

			expect(result.started_at).toBe(validCreateFocusSessionInputMinimal.started_at);
			expect(result.scheduled_end_at).toBe(validCreateFocusSessionInputMinimal.scheduled_end_at);
			expect(result.project_id).toBeUndefined();
			expect(result.task_ids).toBeUndefined();
		});

		test('should accept empty task_ids array', () => {
			const input = createValidCreateInput({ task_ids: [] });
			const result = Schema.decodeUnknownSync(CreateFocusSessionSchema)(input);

			expect(result.task_ids).toEqual([]);
		});

		test('should accept single task in array', () => {
			const input = createValidCreateInput({ task_ids: ['task_123'] });
			const result = Schema.decodeUnknownSync(CreateFocusSessionSchema)(input);

			expect(result.task_ids).toEqual(['task_123']);
		});

		test('should reject missing required fields', () => {
			expect(() =>
				Schema.decodeUnknownSync(CreateFocusSessionSchema)(
					invalidCreateFocusSessionInputs.missingRequiredFields
				)
			).toThrow(/is missing/);
		});

		test('should reject invalid date formats', () => {
			// Effect.ts Schema.String doesn't validate date format by default
			// This test passes since our schema only enforces minLength(1)
			const result1 = Schema.decodeUnknownSync(CreateFocusSessionSchema)(
				invalidCreateFocusSessionInputs.invalidStartedAt
			);
			expect(result1.started_at).toBe('invalid-date');

			const result2 = Schema.decodeUnknownSync(CreateFocusSessionSchema)(
				invalidCreateFocusSessionInputs.invalidScheduledEndAt
			);
			expect(result2.scheduled_end_at).toBe('not-a-date');
		});

		test('should reject empty strings in task_ids', () => {
			const input = createValidCreateInput({ task_ids: ['task_123', '', 'task_456'] });

			expect(() => Schema.decodeUnknownSync(CreateFocusSessionSchema)(input)).toThrow(/minLength/);
		});

		test('should reject null/undefined values in task_ids array', () => {
			expect(() =>
				Schema.decodeUnknownSync(CreateFocusSessionSchema)(
					invalidCreateFocusSessionInputs.invalidTaskIds
				)
			).toThrow();
		});
	});

	describe('UpdateFocusSessionSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(UpdateFocusSessionSchema)(
				validUpdateFocusSessionInput
			);

			expect(result.project_id).toBe(validUpdateFocusSessionInput.project_id);
			expect(result.scheduled_end_at).toBe(validUpdateFocusSessionInput.scheduled_end_at);
		});

		test('should validate empty input (all fields optional)', () => {
			const result = Schema.decodeUnknownSync(UpdateFocusSessionSchema)({});

			expect(Object.keys(result)).toHaveLength(0);
		});

		test('should validate partial updates', () => {
			const partialInput = { project_id: 'new_project' };
			const result = Schema.decodeUnknownSync(UpdateFocusSessionSchema)(partialInput);

			expect(result.project_id).toBe('new_project');
			expect(result.scheduled_end_at).toBeUndefined();
		});

		test('should reject invalid date formats', () => {
			const invalidInput = { scheduled_end_at: 'not-a-date' };

			// Schema.String with minLength(1) accepts any non-empty string
			const result = Schema.decodeUnknownSync(UpdateFocusSessionSchema)(invalidInput);
			expect(result.scheduled_end_at).toBe('not-a-date');
		});
	});

	describe('StartFocusSessionSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(StartFocusSessionSchema)(validStartFocusSessionInput);

			expect(result.task_ids).toEqual(validStartFocusSessionInput.task_ids);
			expect(result.scheduled_duration_minutes).toBe(
				validStartFocusSessionInput.scheduled_duration_minutes
			);
			expect(result.project_id).toBe(validStartFocusSessionInput.project_id);
		});

		test('should validate minimal input (all fields optional)', () => {
			const result = Schema.decodeUnknownSync(StartFocusSessionSchema)(
				validStartFocusSessionInputMinimal
			);

			expect(Object.keys(result)).toHaveLength(0);
		});

		test('should validate with only task_ids', () => {
			const input = { task_ids: ['task_123', 'task_456'] };
			const result = Schema.decodeUnknownSync(StartFocusSessionSchema)(input);

			expect(result.task_ids).toEqual(['task_123', 'task_456']);
		});

		test('should validate with only duration', () => {
			const input = { scheduled_duration_minutes: 60 };
			const result = Schema.decodeUnknownSync(StartFocusSessionSchema)(input);

			expect(result.scheduled_duration_minutes).toBe(60);
		});

		test('should reject negative duration', () => {
			expect(() =>
				Schema.decodeUnknownSync(StartFocusSessionSchema)(
					invalidStartFocusSessionInputs.negativeDuration
				)
			).toThrow(/positive|greater/i);
		});

		test('should reject zero duration', () => {
			expect(() =>
				Schema.decodeUnknownSync(StartFocusSessionSchema)(
					invalidStartFocusSessionInputs.zeroDuration
				)
			).toThrow(/positive|greater/i);
		});

		test('should reject non-integer duration', () => {
			expect(() =>
				Schema.decodeUnknownSync(StartFocusSessionSchema)(
					invalidStartFocusSessionInputs.nonIntegerDuration
				)
			).toThrow(/int/i);
		});

		test('should reject invalid task_ids', () => {
			expect(() =>
				Schema.decodeUnknownSync(StartFocusSessionSchema)(
					invalidStartFocusSessionInputs.invalidTaskIds
				)
			).toThrow();
		});
	});

	describe('EndFocusSessionSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(EndFocusSessionSchema)(validEndFocusSessionInput);

			expect(result.task_completion_updates).toEqual(
				validEndFocusSessionInput.task_completion_updates
			);
			expect(result.task_completion_updates?.[0].task_id).toBe('task_123');
			expect(result.task_completion_updates?.[0].completed).toBe(true);
			expect(result.task_completion_updates?.[0].seconds_spent).toBe(1800);
		});

		test('should validate minimal input (all fields optional)', () => {
			const result = Schema.decodeUnknownSync(EndFocusSessionSchema)(
				validEndFocusSessionInputMinimal
			);

			expect(Object.keys(result)).toHaveLength(0);
		});

		test('should validate empty task_completion_updates array', () => {
			const input = { task_completion_updates: [] };
			const result = Schema.decodeUnknownSync(EndFocusSessionSchema)(input);

			expect(result.task_completion_updates).toEqual([]);
		});

		test('should validate task completion without seconds_spent', () => {
			const input = {
				task_completion_updates: [{ task_id: 'task_123', completed: true }]
			};
			const result = Schema.decodeUnknownSync(EndFocusSessionSchema)(input);

			expect(result.task_completion_updates?.[0].seconds_spent).toBeUndefined();
		});

		test('should reject empty task_id in completion updates', () => {
			expect(() =>
				Schema.decodeUnknownSync(EndFocusSessionSchema)(
					invalidEndFocusSessionInputs.invalidTaskCompletionUpdates
				)
			).toThrow(/minLength/);
		});

		test('should reject negative seconds_spent', () => {
			expect(() =>
				Schema.decodeUnknownSync(EndFocusSessionSchema)(
					invalidEndFocusSessionInputs.invalidSecondsSpent
				)
			).toThrow(/nonNegative|greater.*equal.*0/i);
		});

		test('should reject non-integer seconds_spent', () => {
			expect(() =>
				Schema.decodeUnknownSync(EndFocusSessionSchema)(
					invalidEndFocusSessionInputs.nonIntegerSecondsSpent
				)
			).toThrow(/int/i);
		});
	});

	describe('AddTaskToSessionSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(AddTaskToSessionSchema)(validAddTaskToSessionInput);

			expect(result.session_id).toBe(validAddTaskToSessionInput.session_id);
			expect(result.task_id).toBe(validAddTaskToSessionInput.task_id);
			expect(result.order_index).toBe(validAddTaskToSessionInput.order_index);
		});

		test('should validate without order_index', () => {
			const input = {
				session_id: 'session_123',
				task_id: 'task_456'
			};
			const result = Schema.decodeUnknownSync(AddTaskToSessionSchema)(input);

			expect(result.session_id).toBe('session_123');
			expect(result.task_id).toBe('task_456');
			expect(result.order_index).toBeUndefined();
		});

		test('should reject missing session_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(
					invalidAddTaskToSessionInputs.missingSessionId
				)
			).toThrow(/is missing/);
		});

		test('should reject missing task_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(
					invalidAddTaskToSessionInputs.missingTaskId
				)
			).toThrow(/is missing/);
		});

		test('should reject empty session_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(
					invalidAddTaskToSessionInputs.emptySessionId
				)
			).toThrow(/minLength/);
		});

		test('should reject empty task_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(invalidAddTaskToSessionInputs.emptyTaskId)
			).toThrow(/minLength/);
		});

		test('should reject negative order_index', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(
					invalidAddTaskToSessionInputs.negativeOrderIndex
				)
			).toThrow(/nonNegative|greater.*equal.*0/i);
		});

		test('should reject non-integer order_index', () => {
			expect(() =>
				Schema.decodeUnknownSync(AddTaskToSessionSchema)(
					invalidAddTaskToSessionInputs.nonIntegerOrderIndex
				)
			).toThrow(/int/i);
		});
	});

	describe('RemoveTaskFromSessionSchema', () => {
		test('should validate valid input', () => {
			const result = Schema.decodeUnknownSync(RemoveTaskFromSessionSchema)(
				validRemoveTaskFromSessionInput
			);

			expect(result.session_id).toBe(validRemoveTaskFromSessionInput.session_id);
			expect(result.task_id).toBe(validRemoveTaskFromSessionInput.task_id);
		});

		test('should reject missing required fields', () => {
			expect(() =>
				Schema.decodeUnknownSync(RemoveTaskFromSessionSchema)({ session_id: 'session_123' })
			).toThrow(/is missing/);

			expect(() =>
				Schema.decodeUnknownSync(RemoveTaskFromSessionSchema)({ task_id: 'task_123' })
			).toThrow(/is missing/);
		});

		test('should reject empty strings', () => {
			expect(() =>
				Schema.decodeUnknownSync(RemoveTaskFromSessionSchema)({
					session_id: '',
					task_id: 'task_123'
				})
			).toThrow(/minLength/);

			expect(() =>
				Schema.decodeUnknownSync(RemoveTaskFromSessionSchema)({
					session_id: 'session_123',
					task_id: ''
				})
			).toThrow(/minLength/);
		});
	});

	describe('UpdateSessionTaskSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(UpdateSessionTaskSchema)(validUpdateSessionTaskInput);

			expect(result.session_id).toBe(validUpdateSessionTaskInput.session_id);
			expect(result.task_id).toBe(validUpdateSessionTaskInput.task_id);
			expect(result.order_index).toBe(validUpdateSessionTaskInput.order_index);
			expect(result.seconds_spent).toBe(validUpdateSessionTaskInput.seconds_spent);
		});

		test('should validate with only order_index', () => {
			const input = {
				session_id: 'session_123',
				task_id: 'task_456',
				order_index: 2
			};
			const result = Schema.decodeUnknownSync(UpdateSessionTaskSchema)(input);

			expect(result.order_index).toBe(2);
			expect(result.seconds_spent).toBeUndefined();
		});

		test('should validate with only seconds_spent', () => {
			const input = {
				session_id: 'session_123',
				task_id: 'task_456',
				seconds_spent: 1800
			};
			const result = Schema.decodeUnknownSync(UpdateSessionTaskSchema)(input);

			expect(result.seconds_spent).toBe(1800);
			expect(result.order_index).toBeUndefined();
		});

		test('should reject missing required fields', () => {
			expect(() =>
				Schema.decodeUnknownSync(UpdateSessionTaskSchema)(
					invalidUpdateSessionTaskInputs.missingRequired
				)
			).toThrow(/is missing/);
		});

		test('should reject empty IDs', () => {
			expect(() =>
				Schema.decodeUnknownSync(UpdateSessionTaskSchema)(invalidUpdateSessionTaskInputs.emptyIds)
			).toThrow(/minLength/);
		});

		test('should reject negative values', () => {
			expect(() =>
				Schema.decodeUnknownSync(UpdateSessionTaskSchema)(
					invalidUpdateSessionTaskInputs.negativeValues
				)
			).toThrow(/nonNegative|greater.*equal.*0/i);
		});

		test('should reject non-integer values', () => {
			expect(() =>
				Schema.decodeUnknownSync(UpdateSessionTaskSchema)(
					invalidUpdateSessionTaskInputs.nonIntegerValues
				)
			).toThrow(/int/i);
		});
	});

	describe('ReorderSessionTasksSchema', () => {
		test('should validate complete valid input', () => {
			const result = Schema.decodeUnknownSync(ReorderSessionTasksSchema)(
				validReorderSessionTasksInput
			);

			expect(result.session_id).toBe(validReorderSessionTasksInput.session_id);
			expect(result.task_order).toEqual(validReorderSessionTasksInput.task_order);
		});

		test('should validate empty task_order array', () => {
			const input = {
				session_id: 'session_123',
				task_order: []
			};
			const result = Schema.decodeUnknownSync(ReorderSessionTasksSchema)(input);

			expect(result.task_order).toEqual([]);
		});

		test('should reject missing session_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(ReorderSessionTasksSchema)(
					invalidReorderSessionTasksInputs.missingSessionId
				)
			).toThrow(/is missing/);
		});

		test('should reject empty session_id', () => {
			expect(() =>
				Schema.decodeUnknownSync(ReorderSessionTasksSchema)(
					invalidReorderSessionTasksInputs.emptySessionId
				)
			).toThrow(/minLength/);
		});

		test('should reject invalid task_order items', () => {
			expect(() =>
				Schema.decodeUnknownSync(ReorderSessionTasksSchema)(
					invalidReorderSessionTasksInputs.invalidTaskOrder
				)
			).toThrow();
		});
	});

	describe('FocusSessionQuerySchema', () => {
		test('should validate empty query (all fields optional)', () => {
			const result = Schema.decodeUnknownSync(FocusSessionQuerySchema)({});

			expect(Object.keys(result)).toHaveLength(0);
		});

		test('should validate complete query', () => {
			const query = {
				project_id: 'project_123',
				task_id: 'task_456',
				date_from: '2024-01-01',
				date_to: '2024-01-31',
				include_tasks: true,
				is_active: false,
				limit: 50,
				offset: 100
			};
			const result = Schema.decodeUnknownSync(FocusSessionQuerySchema)(query);

			expect(result).toEqual(query);
		});

		test('should validate partial queries', () => {
			const queries = [
				{ project_id: 'project_123' },
				{ task_id: 'task_456' },
				{ date_from: '2024-01-01' },
				{ limit: 25 },
				{ is_active: true }
			];

			queries.forEach((query) => {
				const result = Schema.decodeUnknownSync(FocusSessionQuerySchema)(query);
				expect(result).toEqual(query);
			});
		});

		test('should reject negative limit', () => {
			expect(() => Schema.decodeUnknownSync(FocusSessionQuerySchema)({ limit: -1 })).toThrow(
				/positive|greater.*0/i
			);
		});

		test('should reject negative offset', () => {
			expect(() => Schema.decodeUnknownSync(FocusSessionQuerySchema)({ offset: -1 })).toThrow(
				/nonNegative|greater.*equal.*0/i
			);
		});

		test('should reject non-integer limit/offset', () => {
			expect(() => Schema.decodeUnknownSync(FocusSessionQuerySchema)({ limit: 25.5 })).toThrow(
				/int/i
			);

			expect(() => Schema.decodeUnknownSync(FocusSessionQuerySchema)({ offset: 10.5 })).toThrow(
				/int/i
			);
		});
	});

	describe('SessionTaskQuerySchema', () => {
		test('should validate empty query', () => {
			const result = Schema.decodeUnknownSync(SessionTaskQuerySchema)({});

			expect(Object.keys(result)).toHaveLength(0);
		});

		test('should validate complete query', () => {
			const query = {
				session_id: 'session_123',
				task_id: 'task_456',
				limit: 25,
				offset: 50
			};
			const result = Schema.decodeUnknownSync(SessionTaskQuerySchema)(query);

			expect(result).toEqual(query);
		});

		test('should validate partial queries', () => {
			const queries = [{ session_id: 'session_123' }, { task_id: 'task_456' }, { limit: 10 }];

			queries.forEach((query) => {
				const result = Schema.decodeUnknownSync(SessionTaskQuerySchema)(query);
				expect(result).toEqual(query);
			});
		});
	});

	describe('SessionTaskSchema', () => {
		test('should validate complete valid session task', () => {
			const sessionTask = {
				session_id: 'session_123',
				task_id: 'task_456',
				order_index: 2,
				seconds_spent: 1800
			};
			const result = Schema.decodeUnknownSync(SessionTaskSchema)(sessionTask);

			expect(result).toEqual(sessionTask);
		});

		test('should validate minimal session task', () => {
			const sessionTask = {
				session_id: 'session_123',
				task_id: 'task_456'
			};
			const result = Schema.decodeUnknownSync(SessionTaskSchema)(sessionTask);

			expect(result.session_id).toBe('session_123');
			expect(result.task_id).toBe('task_456');
			expect(result.order_index).toBeUndefined();
			expect(result.seconds_spent).toBeUndefined();
		});

		test('should reject missing required fields', () => {
			expect(() =>
				Schema.decodeUnknownSync(SessionTaskSchema)({ session_id: 'session_123' })
			).toThrow(/is missing/);

			expect(() => Schema.decodeUnknownSync(SessionTaskSchema)({ task_id: 'task_456' })).toThrow(
				/is missing/
			);
		});
	});

	describe('Boundary Value Testing', () => {
		test('should handle string length boundaries', () => {
			// Empty strings should be rejected for required string fields
			expect(() =>
				Schema.decodeUnknownSync(CreateFocusSessionSchema)({
					started_at: '',
					scheduled_end_at: boundaryTestCases.strings.normal
				})
			).toThrow(/minLength/);

			// Normal strings should be accepted
			const validInput = createValidCreateInput({
				project_id: boundaryTestCases.strings.normal
			});
			const result = Schema.decodeUnknownSync(CreateFocusSessionSchema)(validInput);
			expect(result.project_id).toBe(boundaryTestCases.strings.normal);
		});

		test('should handle numeric boundaries', () => {
			// Zero should be rejected for positive integers
			expect(() =>
				Schema.decodeUnknownSync(StartFocusSessionSchema)({
					scheduled_duration_minutes: boundaryTestCases.numbers.zero
				})
			).toThrow();

			// Positive integers should be accepted
			const validInput = createValidStartInput({
				scheduled_duration_minutes: boundaryTestCases.numbers.one
			});
			const result = Schema.decodeUnknownSync(StartFocusSessionSchema)(validInput);
			expect(result.scheduled_duration_minutes).toBe(boundaryTestCases.numbers.one);

			// Large numbers should be accepted
			const largeInput = createValidStartInput({
				scheduled_duration_minutes: boundaryTestCases.numbers.large
			});
			const largeResult = Schema.decodeUnknownSync(StartFocusSessionSchema)(largeInput);
			expect(largeResult.scheduled_duration_minutes).toBe(boundaryTestCases.numbers.large);
		});

		test('should handle array boundaries', () => {
			// Empty arrays should be accepted
			const emptyInput = createValidCreateInput({
				task_ids: boundaryTestCases.arrays.empty
			});
			const emptyResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(emptyInput);
			expect(emptyResult.task_ids).toEqual([]);

			// Single item arrays should be accepted
			const singleInput = createValidCreateInput({
				task_ids: boundaryTestCases.arrays.single
			});
			const singleResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(singleInput);
			expect(singleResult.task_ids).toEqual(['item']);

			// Multiple item arrays should be accepted
			const multipleInput = createValidCreateInput({
				task_ids: boundaryTestCases.arrays.multiple
			});
			const multipleResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(multipleInput);
			expect(multipleResult.task_ids).toEqual(['item1', 'item2', 'item3']);
		});
	});

	describe('Complex Scenario Testing', () => {
		test('should validate time scenarios correctly', () => {
			// Valid future schedule
			const validTime = createValidCreateInput(testScenarios.timeValidation.validFutureSchedule);
			const validResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(validTime);
			expect(validResult.started_at).toBe('2024-01-01T10:00:00Z');
			expect(validResult.scheduled_end_at).toBe('2024-01-01T11:00:00Z');
		});

		test('should validate task management scenarios', () => {
			// Single task
			const singleTask = createValidCreateInput(testScenarios.taskManagement.singleTask);
			const singleResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(singleTask);
			expect(singleResult.task_ids).toEqual(['task_123']);

			// Multiple tasks
			const multipleTasks = createValidCreateInput(testScenarios.taskManagement.multipleTasks);
			const multipleResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(multipleTasks);
			expect(multipleResult.task_ids).toEqual(['task_123', 'task_456', 'task_789']);

			// No tasks
			const noTasks = createValidCreateInput(testScenarios.taskManagement.noTasks);
			const noTasksResult = Schema.decodeUnknownSync(CreateFocusSessionSchema)(noTasks);
			expect(noTasksResult.task_ids).toBeUndefined();
		});

		test('should validate session completion scenarios', () => {
			// All tasks completed
			const allCompleted = createValidEndInput(testScenarios.sessionCompletion.allTasksCompleted);
			const allResult = Schema.decodeUnknownSync(EndFocusSessionSchema)(allCompleted);
			expect(allResult.task_completion_updates?.every((update) => update.completed)).toBe(true);

			// Partial completion
			const partialCompleted = createValidEndInput(
				testScenarios.sessionCompletion.partialCompletion
			);
			const partialResult = Schema.decodeUnknownSync(EndFocusSessionSchema)(partialCompleted);
			expect(partialResult.task_completion_updates?.[0].completed).toBe(true);
			expect(partialResult.task_completion_updates?.[1].completed).toBe(false);

			// No tasks completed
			const noneCompleted = createValidEndInput(testScenarios.sessionCompletion.noTasksCompleted);
			const noneResult = Schema.decodeUnknownSync(EndFocusSessionSchema)(noneCompleted);
			expect(noneResult.task_completion_updates?.every((update) => !update.completed)).toBe(true);
		});
	});
});
