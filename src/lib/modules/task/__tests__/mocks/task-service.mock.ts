import { Layer, Effect } from 'effect';
import { TaskService } from '../../service.server';
import { createInvalidTaskStatusTransitionError, type DomainError } from '$lib/shared/errors';
import type { Tables } from '$lib/infra/supabase/types';
import type {
	CreateTaskInput,
	UpdateTaskInput,
	TaskQueryInput,
	MoveTaskToProjectInput
} from '../../schema';

// Mock Task Service
export const createMockTaskService = (
	overrides: Partial<{
		createTaskAsync: (input: CreateTaskInput) => Effect.Effect<Tables<'tasks'>, never>;
		getTaskByIdAsync: (id: string) => Effect.Effect<Tables<'tasks'> | null, never>;
		getTasksAsync: (query?: TaskQueryInput) => Effect.Effect<Tables<'tasks'>[], never>;
		getInboxTasksAsync: () => Effect.Effect<Tables<'tasks'>[], never>;
		updateTaskAsync: (id: string, input: UpdateTaskInput) => Effect.Effect<Tables<'tasks'>, never>;
		moveTaskToProjectAsync: (
			input: MoveTaskToProjectInput
		) => Effect.Effect<Tables<'tasks'>, never>;
		deleteTaskAsync: (id: string) => Effect.Effect<void, never>;
		updateTaskStatusAsync: (
			id: string,
			status: Tables<'tasks'>['status']
		) => Effect.Effect<Tables<'tasks'>, DomainError>;
		validateTaskStatusTransitionSync: (
			currentStatus: Tables<'tasks'>['status'],
			newStatus: Tables<'tasks'>['status']
		) => Effect.Effect<void, DomainError>;
	}> = {}
) => {
	const defaultTaskService = {
		createTaskAsync: (input: CreateTaskInput) =>
			Effect.succeed({
				id: 'mock_task_id',
				owner_id: 'user_123',
				title: input.title || 'Mock Task',
				description: input.description || null,
				project_id: input.project_id || null,
				status: input.status || 'backlog',
				planned_for: input.planned_for || null,
				blocked_note: input.blocked_note || null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'tasks'>),

		getTaskByIdAsync: (id: string) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				title: 'Mock Task',
				description: null,
				project_id: 'project_123',
				status: 'backlog' as const,
				planned_for: null,
				blocked_note: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'tasks'>),

		getTasksAsync: () => Effect.succeed([]),

		getInboxTasksAsync: () => Effect.succeed([]),

		updateTaskAsync: (id: string, input: UpdateTaskInput) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				title: 'Updated Task',
				description: input.description || null,
				project_id: input.project_id || null,
				status: input.status || 'backlog',
				planned_for: input.planned_for || null,
				blocked_note: input.blocked_note || null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'tasks'>),

		moveTaskToProjectAsync: (input: MoveTaskToProjectInput) =>
			Effect.succeed({
				id: input.task_id,
				owner_id: 'user_123',
				title: 'Moved Task',
				description: null,
				project_id: input.project_id,
				status: 'backlog' as const,
				planned_for: null,
				blocked_note: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'tasks'>),

		deleteTaskAsync: () => Effect.void,

		updateTaskStatusAsync: (id: string, status: Tables<'tasks'>['status']) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				title: 'Status Updated Task',
				description: null,
				project_id: 'project_123',
				status,
				planned_for: null,
				blocked_note: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'tasks'>),

		validateTaskStatusTransitionSync: (
			currentStatus: Tables<'tasks'>['status'],
			newStatus: Tables<'tasks'>['status']
		) => {
			const validTransitions: Record<string, string[]> = {
				backlog: ['planned', 'blocked'],
				planned: ['in_session', 'blocked', 'completed'],
				in_session: ['planned', 'blocked', 'completed'],
				blocked: ['planned', 'backlog'],
				completed: ['planned', 'backlog']
			};

			if (validTransitions[currentStatus]?.includes(newStatus)) {
				return Effect.void;
			}
			return Effect.fail(createInvalidTaskStatusTransitionError(currentStatus, newStatus));
		}
	};

	return Layer.succeed(TaskService, { ...defaultTaskService, ...overrides });
};

// Error simulation helpers
export const createFailingTaskService = () => {
	return createMockTaskService({
		getTaskByIdAsync: () => Effect.succeed(null),
		updateTaskStatusAsync: () =>
			Effect.fail(createInvalidTaskStatusTransitionError('unknown', 'unknown'))
	});
};
