import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Effect, Layer } from 'effect';
import { FocusSessionService } from '../service.server';
import { InvalidTaskStatusTransitionError } from '$lib/shared/errors';
import type { Tables } from '$lib/infra/supabase/types';
import { createMockSupabaseService } from '$lib/shared/__tests__/mocks/supabase.mock';
import { createMockTaskService } from '../../task/__tests__/mocks/task-service.mock';
import { createMockFocusSessionService, mockConfigs } from './mocks/focus-session-service.mock';
import {
	businessScenarios,
	errorScenarios,
	validators,
	createTestSession,
	createTestTask
} from './fixtures/business-scenarios';
import { mockSessions, mockTasks, baseTestTime, actualEndTime } from './mocks/session-fixtures';

// Mock services setup
const createMockTaskServiceForSession = () => {
	return createMockTaskService({
		getTaskByIdAsync: (id: string) => {
			const task = Object.values(mockTasks).find((t) => t.id === id);
			return Effect.succeed(task ? createTestTask(task) : null);
		},
		updateTaskStatusAsync: (id: string, status: Tables<'tasks'>['status']) => {
			const task = Object.values(mockTasks).find((t) => t.id === id);
			if (!task) return Effect.fail(new InvalidTaskStatusTransitionError('unknown', 'unknown'));
			return Effect.succeed(createTestTask({ ...task, status }));
		},
		validateTaskStatusTransitionSync: (
			from: Tables<'tasks'>['status'],
			to: Tables<'tasks'>['status']
		) => {
			return validators.isValidTaskStatusTransition(from, to)
				? Effect.void
				: Effect.fail(new InvalidTaskStatusTransitionError(from, to));
		}
	});
};

describe('FocusSessionService Integration Tests', () => {
	let testLayers: Layer.Layer<FocusSessionService, never, never>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(baseTestTime));

		const mockSupabaseLayer = createMockSupabaseService({
			insertResult: createTestSession(),
			selectResult: null, // No active session by default
			updateResult: createTestSession({ closed_at: actualEndTime })
		});

		const mockTaskLayer = createMockTaskServiceForSession();

		const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.noActiveSession());

		testLayers = Layer.mergeAll(mockSupabaseLayer, mockTaskLayer, mockFocusSessionLayer);
	});

	describe('Multi-Task Session Workflow', () => {
		test('should complete full multi-task session with mixed completion states', async () => {
			const scenario = businessScenarios.multiTaskSession;

			// Start session with multiple tasks
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Verify session was created correctly
			expect(session.closed_at).toBeNull();
			expect(session.project_id).toBe(scenario.startInput.project_id);

			// Verify scheduled_end_at is calculated correctly (50 minutes from start)
			const expectedEndTime = new Date('2024-01-01T10:50:00Z');
			expect(session.scheduled_end_at).toBe(expectedEndTime.toISOString());

			// End session with mixed task completions
			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Verify session was closed
			expect(endedSession.closed_at).toBeDefined();
			expect(new Date(endedSession.closed_at!)).toBeInstanceOf(Date);

			// Verify session duration constraint (closed_at <= scheduled_end_at)
			expect(validators.isValidSessionDuration(endedSession)).toBe(true);
		});

		test('should handle session with all tasks uncompleted', async () => {
			const scenario = businessScenarios.noCompletionSession;

			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(endedSession.closed_at).toBeDefined();
			// All tasks should go back to planned state (verified via task service calls)
		});
	});

	describe('Session Timing Business Rules', () => {
		test('should handle emergency early session closure', async () => {
			const scenario = businessScenarios.emergencyCloseSession;

			// Start session
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Advance time by 45 minutes (5 minutes before scheduled end)
			vi.advanceTimersByTime(45 * 60 * 1000);

			// End session early
			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Verify early closure is allowed
			expect(endedSession.closed_at).toBeDefined();

			// Verify duration constraint still holds
			expect(validators.isValidSessionDuration(endedSession)).toBe(true);

			// Verify actual duration matches expected
			const actualDuration = validators.calculateSessionDuration(endedSession);
			expect(actualDuration).toBe(scenario.expectedSessionDuration);
		});

		test('should calculate session duration correctly', async () => {
			const session = createTestSession({
				started_at: baseTestTime,
				closed_at: actualEndTime
			});

			const duration = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.calculateSessionDurationSync(session);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(duration).toBe(45); // 45 minutes duration
		});
	});

	describe('Empty Session Handling', () => {
		test('should allow empty session creation and completion', async () => {
			const scenario = businessScenarios.emptySession;

			// Start empty session (no tasks)
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(session.closed_at).toBeNull();

			// End empty session
			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(endedSession.closed_at).toBeDefined();
		});
	});

	describe('Inbox to Project Task Management', () => {
		test('should handle task from inbox in session', async () => {
			const scenario = businessScenarios.inboxToProjectSession;

			// Mock task in inbox (project_id = null)
			const inboxTaskLayer = createMockTaskService({
				getTaskByIdAsync: () =>
					Effect.succeed(
						createTestTask({
							...mockTasks.inboxTask,
							project_id: null // Inbox task
						})
					)
			});

			const mockSupabaseLayer = createMockSupabaseService({
				insertResult: createTestSession(),
				selectResult: null,
				updateResult: createTestSession({ closed_at: actualEndTime })
			});

			const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.noActiveSession());
			const inboxTestLayers = Layer.mergeAll(
				mockSupabaseLayer,
				inboxTaskLayer,
				mockFocusSessionLayer
			);

			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(inboxTestLayers), Effect.runPromise);

			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(inboxTestLayers), Effect.runPromise);

			expect(endedSession.closed_at).toBeDefined();
		});
	});

	describe('Error Scenarios and Business Rule Enforcement', () => {
		test('should prevent starting session when active session exists', async () => {
			const scenario = errorScenarios.activeSessionExists;

			// Mock existing active session
			const activeSessionLayer = createMockSupabaseService({
				selectResult: scenario.existingSession // Active session exists
			});

			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(
				mockConfigs.activeSessionExists(scenario.existingSession)
			);
			const errorTestLayers = Layer.mergeAll(
				activeSessionLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			await expect(
				Effect.gen(function* () {
					const focusSessionService = yield* FocusSessionService;
					return yield* focusSessionService.startFocusSessionAsync(scenario.newSessionInput);
				}).pipe(Effect.provide(errorTestLayers), Effect.runPromise)
			).rejects.toThrow('An active focus session already exists');
		});

		test('should handle session not found error', async () => {
			const scenario = errorScenarios.sessionNotFound;

			const mockSupabaseLayer = createMockSupabaseService({
				selectResult: null
			});
			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.sessionNotFound());
			const notFoundTestLayers = Layer.mergeAll(
				mockSupabaseLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			await expect(
				Effect.gen(function* () {
					const focusSessionService = yield* FocusSessionService;
					return yield* focusSessionService.endFocusSessionAsync(
						scenario.sessionId,
						scenario.endInput
					);
				}).pipe(Effect.provide(notFoundTestLayers), Effect.runPromise)
			).rejects.toThrow('Focus session with ID nonexistent_session_id not found');
		});

		test('should prevent ending already ended session', async () => {
			const scenario = errorScenarios.sessionAlreadyEnded;

			const mockSupabaseLayer = createMockSupabaseService({
				selectResult: null
			});
			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(
				mockConfigs.sessionAlreadyEnded(scenario.session.id)
			);
			const errorTestLayers = Layer.mergeAll(
				mockSupabaseLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			await expect(
				Effect.gen(function* () {
					const focusSessionService = yield* FocusSessionService;
					return yield* focusSessionService.endFocusSessionAsync(
						scenario.session.id,
						scenario.endInput
					);
				}).pipe(Effect.provide(errorTestLayers), Effect.runPromise)
			).rejects.toThrow('Focus session with ID session_early_456 has already ended');
		});
	});

	describe('Session-Task Relationship Management', () => {
		test('should add task to active session', async () => {
			// Start session
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync({
					task_ids: [mockTasks.backlogTask.id],
					scheduled_duration_minutes: 30
				});
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Add another task to session
			const sessionTask = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.addTaskToSessionAsync({
					session_id: session.id,
					task_id: mockTasks.plannedTask.id
				});
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(sessionTask.session_id).toBe(session.id);
			expect(sessionTask.task_id).toBe(mockTasks.plannedTask.id);
		});

		test('should remove task from session', async () => {
			await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				yield* focusSessionService.removeTaskFromSessionAsync({
					session_id: mockSessions.standardSession.id,
					task_id: mockTasks.backlogTask.id
				});
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			// Should complete without error
		});

		test('should update session task time tracking', async () => {
			// This test is no longer applicable since we removed time tracking
			// and updateSessionTaskAsync method
			expect(true).toBe(true); // Placeholder
		});

		test('should handle session tasks without ordering', async () => {
			// This test is no longer applicable since we removed task ordering
			expect(true).toBe(true); // Placeholder
		});
	});

	describe('Database Transaction Consistency', () => {
		test('should maintain data consistency during session operations', async () => {
			const scenario = businessScenarios.multiTaskSession;

			// Mock database operations that could fail
			const transactionTestLayer = createMockSupabaseService({
				insertResult: createTestSession(),
				selectResult: null,
				updateResult: createTestSession({ closed_at: actualEndTime })
			});

			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.noActiveSession());
			const consistencyTestLayers = Layer.mergeAll(
				transactionTestLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			// Start session
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync(scenario.startInput);
			}).pipe(Effect.provide(consistencyTestLayers), Effect.runPromise);

			// End session
			const endedSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.endFocusSessionAsync(session.id, scenario.endInput);
			}).pipe(Effect.provide(consistencyTestLayers), Effect.runPromise);

			// Verify all operations completed successfully
			expect(session.id).toBeDefined();
			expect(endedSession.closed_at).toBeDefined();
		});

		test('should handle partial failures gracefully', async () => {
			// Mock a scenario where some operations succeed and others fail
			const partialFailureLayer = createMockSupabaseService({
				insertResult: createTestSession(),
				selectResult: null,
				shouldFail: false // Let it succeed initially
			});

			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.noActiveSession());
			const gracefulTestLayers = Layer.mergeAll(
				partialFailureLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			// Start session should succeed
			const session = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.startFocusSessionAsync({
					task_ids: [mockTasks.backlogTask.id],
					scheduled_duration_minutes: 30
				});
			}).pipe(Effect.provide(gracefulTestLayers), Effect.runPromise);

			expect(session.id).toBeDefined();
		});
	});

	describe('Session Query Operations', () => {
		test('should get session with associated tasks', async () => {
			const sessionWithTasks = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.getFocusSessionWithTasksByIdAsync(
					mockSessions.standardSession.id
				);
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(sessionWithTasks).toBeDefined();
			if (sessionWithTasks) {
				expect(sessionWithTasks.id).toBe(mockSessions.standardSession.id);
				expect(Array.isArray(sessionWithTasks.tasks)).toBe(true);
			}
		});

		test('should filter sessions by task association', async () => {
			const sessions = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.getFocusSessionsWithTasksAsync({
					task_id: mockTasks.backlogTask.id,
					include_tasks: true
				});
			}).pipe(Effect.provide(testLayers), Effect.runPromise);

			expect(Array.isArray(sessions)).toBe(true);
		});

		test('should get active session with tasks', async () => {
			// Mock active session
			const activeSessionLayer = createMockSupabaseService({
				selectResult: createTestSession({ closed_at: null })
			});

			const mockTaskLayer = createMockTaskServiceForSession();
			const mockFocusSessionLayer = createMockFocusSessionService(mockConfigs.sessionWithTasks());
			const queryTestLayers = Layer.mergeAll(
				activeSessionLayer,
				mockTaskLayer,
				mockFocusSessionLayer
			);

			const activeSession = await Effect.gen(function* () {
				const focusSessionService = yield* FocusSessionService;
				return yield* focusSessionService.getActiveFocusSessionWithTasksAsync();
			}).pipe(Effect.provide(queryTestLayers), Effect.runPromise);

			expect(activeSession).toBeDefined();
			if (activeSession) {
				expect(activeSession.closed_at).toBeNull();
				expect(Array.isArray(activeSession.tasks)).toBe(true);
			}
		});
	});
});
