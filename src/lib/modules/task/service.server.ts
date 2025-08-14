import { mapPostgrestError, SupabasePostgrestError, type DomainError } from '$lib/shared/errors';
import { Context, Effect, Layer, Option, DateTime, Schema } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import {
	CreateTaskSchema,
	UpdateTaskSchema,
	TaskQuerySchema,
	MoveTaskToProjectSchema
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';
import { InvalidTaskStatusTransitionError } from './errors';

export type Task = Tables<'tasks'>;

export class TaskService extends Context.Tag('Task')<
	TaskService,
	{
		/**
		 * Creates a new task for the authenticated user.
		 *
		 * Tasks can be created in any project or in the inbox (no project).
		 * Default status is 'backlog' if not specified. All tasks are owned by the current user.
		 *
		 * @param input - The task creation parameters including title, description, project assignment, and initial status
		 * @returns Effect that succeeds with the created Task or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail (connection issues, constraint violations, access denied)
		 *
		 * @example
		 * ```typescript
		 * // Create task in inbox
		 * const inboxTask = yield* taskService.createTaskAsync({
		 *   title: 'Review documentation',
		 *   description: 'Review and update API docs',
		 *   project_id: null
		 * });
		 *
		 * // Create task in specific project
		 * const projectTask = yield* taskService.createTaskAsync({
		 *   title: 'Implement feature',
		 *   project_id: 'proj_123',
		 *   status: 'planned'
		 * });
		 * ```
		 */
		readonly createTaskAsync: (
			input: Schema.Schema.Type<typeof CreateTaskSchema>
		) => Effect.Effect<Task, SupabasePostgrestError>;

		/**
		 * Retrieves a task by its unique identifier.
		 *
		 * Performs a secure lookup that only returns tasks owned by the authenticated user.
		 * Returns None if the task doesn't exist or the user lacks access.
		 *
		 * @param id - The unique identifier of the task to retrieve
		 * @returns Effect that succeeds with Some(Task) if found, None if not found, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const task = yield* taskService.getTaskByIdAsync('task_123');
		 * if (Option.isSome(task)) {
		 *   console.log('Found task:', task.value.title);
		 *   console.log('Status:', task.value.status);
		 * } else {
		 *   console.log('Task not found or access denied');
		 * }
		 * ```
		 */
		readonly getTaskByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<Task>, SupabasePostgrestError>;

		/**
		 * Retrieves a list of tasks based on query filters.
		 *
		 * Supports filtering by project, status, planned date, and text search.
		 * Text search matches against both title and description fields.
		 * Results are ordered by last update time (most recent first).
		 *
		 * @param query - Optional query filters including project_id, status, search terms, and pagination
		 * @returns Effect that succeeds with an array of Task objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * // Get all tasks
		 * const allTasks = yield* taskService.getTasksAsync();
		 *
		 * // Get tasks for specific project
		 * const projectTasks = yield* taskService.getTasksAsync({ project_id: 'proj_123' });
		 *
		 * // Get inbox tasks (no project)
		 * const inboxTasks = yield* taskService.getTasksAsync({ project_id: null });
		 *
		 * // Search tasks by content
		 * const searchResults = yield* taskService.getTasksAsync({ search: 'API' });
		 *
		 * // Get planned tasks
		 * const plannedTasks = yield* taskService.getTasksAsync({ status: 'planned' });
		 * ```
		 */
		readonly getTasksAsync: (
			query?: Schema.Schema.Type<typeof TaskQuerySchema>
		) => Effect.Effect<Task[], SupabasePostgrestError>;

		/**
		 * Retrieves all tasks in the user's inbox (tasks without project assignment).
		 *
		 * This is a convenience method that fetches all tasks where project_id is null,
		 * representing the user's inbox or backlog of unorganized tasks.
		 * Results are ordered by last update time (most recent first).
		 *
		 * @returns Effect that succeeds with an array of inbox Task objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const inboxTasks = yield* taskService.getInboxTasksAsync();
		 * console.log(`You have ${inboxTasks.length} tasks in your inbox`);
		 * inboxTasks.forEach(task => {
		 *   console.log(`- ${task.title} (${task.status})`);
		 * });
		 * ```
		 */
		readonly getInboxTasksAsync: () => Effect.Effect<Task[], SupabasePostgrestError>;

		/**
		 * Updates an existing task with new values.
		 *
		 * Allows partial updates of task properties. Only provided fields will be updated,
		 * leaving other properties unchanged. For status updates with validation, use updateTaskStatusAsync.
		 *
		 * @param id - The unique identifier of the task to update
		 * @param input - Partial update data containing fields to modify
		 * @returns Effect that succeeds with the updated Task or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, task not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Update task title and description
		 * const updatedTask = yield* taskService.updateTaskAsync('task_123', {
		 *   title: 'Updated Task Title',
		 *   description: 'New description'
		 * });
		 *
		 * // Move task to different project
		 * const movedTask = yield* taskService.updateTaskAsync('task_123', {
		 *   project_id: 'proj_456'
		 * });
		 *
		 * // Add blocking note
		 * const blockedTask = yield* taskService.updateTaskAsync('task_123', {
		 *   status: 'blocked',
		 *   blocked_note: 'Waiting for external dependency'
		 * });
		 * ```
		 */
		readonly updateTaskAsync: (
			id: string,
			input: Schema.Schema.Type<typeof UpdateTaskSchema>
		) => Effect.Effect<Task, SupabasePostgrestError>;

		/**
		 * Moves a task to a different project or to the inbox.
		 *
		 * This is a specialized update operation that changes only the project assignment.
		 * Use null as project_id to move tasks to the inbox (unassigned state).
		 *
		 * @param input - Contains task_id and target project_id (or null for inbox)
		 * @returns Effect that succeeds with the updated Task or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, task/project not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Move task to different project
		 * const movedTask = yield* taskService.moveTaskToProjectAsync({
		 *   task_id: 'task_123',
		 *   project_id: 'proj_456'
		 * });
		 *
		 * // Move task to inbox
		 * const inboxTask = yield* taskService.moveTaskToProjectAsync({
		 *   task_id: 'task_123',
		 *   project_id: null
		 * });
		 * ```
		 */
		readonly moveTaskToProjectAsync: (
			input: Schema.Schema.Type<typeof MoveTaskToProjectSchema>
		) => Effect.Effect<Task, SupabasePostgrestError>;

		/**
		 * Permanently deletes a task and all its associated data.
		 *
		 * This operation removes the task record and cascades to delete all related
		 * session_tasks entries. This action cannot be undone.
		 *
		 * @param id - The unique identifier of the task to delete
		 * @returns Effect that succeeds with void or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, task not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * yield* taskService.deleteTaskAsync('task_123');
		 * console.log('Task deleted successfully');
		 * ```
		 */
		readonly deleteTaskAsync: (id: string) => Effect.Effect<void, SupabasePostgrestError>;

		/**
		 * Updates a task's status with transition validation.
		 *
		 * Validates that the status transition is allowed according to business rules
		 * before performing the update. This ensures task workflow integrity.
		 *
		 * @param id - The unique identifier of the task to update
		 * @param status - The new status to transition to
		 * @returns Effect that succeeds with the updated Task or fails with validation or database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, task not found, or access denied
		 * @throws {InvalidTaskStatusTransitionError} When the status transition is not allowed by business rules
		 *
		 * @example
		 * ```typescript
		 * // Valid transitions
		 * const plannedTask = yield* taskService.updateTaskStatusAsync('task_123', 'planned');
		 * const inSessionTask = yield* taskService.updateTaskStatusAsync('task_123', 'in_session');
		 * const completedTask = yield* taskService.updateTaskStatusAsync('task_123', 'completed');
		 *
		 * // Invalid transition will throw InvalidTaskStatusTransitionError
		 * try {
		 *   yield* taskService.updateTaskStatusAsync('task_123', 'completed'); // from backlog directly
		 * } catch (error) {
		 *   console.log('Invalid transition:', error.message);
		 * }
		 * ```
		 */
		readonly updateTaskStatusAsync: (
			id: string,
			status: Tables<'tasks'>['status']
		) => Effect.Effect<Task, SupabasePostgrestError | DomainError>;

		/**
		 * Validates if a task status transition is allowed according to business rules.
		 *
		 * This is a synchronous utility method that checks transition validity without
		 * performing any I/O operations. Used internally by updateTaskStatusAsync.
		 *
		 * Allowed transitions:
		 * - backlog → planned, blocked
		 * - planned → in_session, blocked, completed
		 * - in_session → planned, blocked, completed
		 * - blocked → planned, backlog
		 * - completed → planned, backlog
		 *
		 * @param currentStatus - The current status of the task
		 * @param newStatus - The desired new status
		 * @returns Effect that succeeds with void if transition is valid, or fails with validation error
		 *
		 * @throws {InvalidTaskStatusTransitionError} When the status transition violates business rules
		 *
		 * @example
		 * ```typescript
		 * // Check if transition is valid before updating
		 * yield* taskService.validateTaskStatusTransitionSync('backlog', 'planned'); // ✅ Valid
		 * yield* taskService.validateTaskStatusTransitionSync('backlog', 'completed'); // ❌ Invalid
		 * ```
		 */
		readonly validateTaskStatusTransitionSync: (
			currentStatus: Tables<'tasks'>['status'],
			newStatus: Tables<'tasks'>['status']
		) => Effect.Effect<void, DomainError>;
	}
>() {}

export const TaskLive = Layer.effect(
	TaskService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;

		return {
			createTaskAsync: (input: Schema.Schema.Type<typeof CreateTaskSchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const insertData: TablesInsert<'tasks'> = {
							title: input.title,
							description: input.description,
							project_id: input.project_id,
							status: input.status ?? 'backlog',
							planned_for: input.planned_for
								? DateTime.formatIso(input.planned_for).split('T')[0]
								: null,
							blocked_note: input.blocked_note
						};

						return Effect.promise(() => client.from('tasks').insert(insertData).select().single());
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			getTaskByIdAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('tasks').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getTasksAsync: (query?: Schema.Schema.Type<typeof TaskQuerySchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						let queryBuilder = client.from('tasks').select();

						if (query?.project_id !== undefined) {
							if (query.project_id === null) {
								queryBuilder = queryBuilder.is('project_id', null);
							} else {
								queryBuilder = queryBuilder.eq('project_id', query.project_id);
							}
						}

						if (query?.status) {
							queryBuilder = queryBuilder.eq('status', query.status);
						}

						if (query?.planned_for) {
							queryBuilder = queryBuilder.eq(
								'planned_for',
								DateTime.formatIso(query.planned_for).split('T')[0]
							);
						}

						if (query?.search) {
							queryBuilder = queryBuilder.or(
								`title.ilike.%${query.search}%,description.ilike.%${query.search}%`
							);
						}

						if (query?.limit) {
							queryBuilder = queryBuilder.limit(query.limit);
						}

						if (query?.offset) {
							queryBuilder = queryBuilder.range(
								query.offset,
								query.offset + (query.limit ?? 50) - 1
							);
						}

						queryBuilder = queryBuilder.order('updated_at', { ascending: false });

						return Effect.promise(() => queryBuilder);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			getInboxTasksAsync: () =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('tasks')
								.select()
								.is('project_id', null)
								.order('updated_at', { ascending: false })
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			updateTaskAsync: (id: string, input: Schema.Schema.Type<typeof UpdateTaskSchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'tasks'> = {};

						if (input.title !== undefined) updateData.title = input.title;
						if (input.description !== undefined) updateData.description = input.description;
						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.status !== undefined) updateData.status = input.status;
						if (input.planned_for !== undefined)
							updateData.planned_for = input.planned_for
								? DateTime.formatIso(input.planned_for).split('T')[0]
								: null;
						if (input.blocked_note !== undefined) updateData.blocked_note = input.blocked_note;

						return Effect.promise(() =>
							client.from('tasks').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			moveTaskToProjectAsync: (input: Schema.Schema.Type<typeof MoveTaskToProjectSchema>) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('tasks')
								.update({ project_id: input.project_id })
								.eq('id', input.task_id)
								.select()
								.single()
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			deleteTaskAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('tasks').delete().eq('id', id))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
					)
				),

			updateTaskStatusAsync: (id: string, status: Tables<'tasks'>['status']) =>
				Effect.gen(function* () {
					// First get the current task to validate status transition
					const currentTask = yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() => client.from('tasks').select().eq('id', id).single())
						),
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Validate status transition
					yield* validateTaskStatusTransition(currentTask.status, status);

					// Update task status
					return yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() =>
								client.from('tasks').update({ status }).eq('id', id).select().single()
							)
						),
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);
				}),

			validateTaskStatusTransitionSync: (currentStatus, newStatus) =>
				validateTaskStatusTransition(currentStatus, newStatus)
		};
	})
);

/**
 * Validates if a task status transition is allowed
 */
function validateTaskStatusTransition(
	currentStatus: Tables<'tasks'>['status'],
	newStatus: Tables<'tasks'>['status']
): Effect.Effect<void, DomainError> {
	// Same status is always allowed
	if (currentStatus === newStatus) {
		return Effect.void;
	}

	// Define allowed transitions
	const allowedTransitions: Record<Tables<'tasks'>['status'], Tables<'tasks'>['status'][]> = {
		backlog: ['planned', 'blocked'], // backlog can go to planned or blocked
		planned: ['in_session', 'blocked', 'completed'], // planned can start session, be blocked, or completed directly
		in_session: ['planned', 'blocked', 'completed'], // in_session can go back to planned, be blocked, or completed
		blocked: ['planned', 'backlog'], // blocked can be unblocked to planned or sent back to backlog
		completed: ['planned', 'backlog'] // completed can be reopened to planned or backlog
	};

	const allowedTargets = allowedTransitions[currentStatus];

	if (!allowedTargets.includes(newStatus)) {
		return Effect.fail(new InvalidTaskStatusTransitionError(currentStatus, newStatus));
	}

	return Effect.void;
}
