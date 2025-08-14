import { mapPostgrestError, SupabasePostgrestError, type DomainError } from '$lib/shared/errors';
import { Context, Effect, Layer, Option } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import {
	type CreateTaskInput,
	type UpdateTaskInput,
	type TaskQueryInput,
	type MoveTaskToProjectInput
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';
import { InvalidTaskStatusTransitionError } from './errors';

export type Task = Tables<'tasks'>;

export class TaskService extends Context.Tag('Task')<
	TaskService,
	{
		readonly createTaskAsync: (
			input: CreateTaskInput
		) => Effect.Effect<Task, SupabasePostgrestError>;
		readonly getTaskByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<Task>, SupabasePostgrestError>;
		readonly getTasksAsync: (
			query?: TaskQueryInput
		) => Effect.Effect<Task[], SupabasePostgrestError>;
		readonly getInboxTasksAsync: () => Effect.Effect<Task[], SupabasePostgrestError>;
		readonly updateTaskAsync: (
			id: string,
			input: UpdateTaskInput
		) => Effect.Effect<Task, SupabasePostgrestError>;
		readonly moveTaskToProjectAsync: (
			input: MoveTaskToProjectInput
		) => Effect.Effect<Task, SupabasePostgrestError>;
		readonly deleteTaskAsync: (id: string) => Effect.Effect<void, SupabasePostgrestError>;
		readonly updateTaskStatusAsync: (
			id: string,
			status: Tables<'tasks'>['status']
		) => Effect.Effect<Task, SupabasePostgrestError | DomainError>;
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
			createTaskAsync: (input: CreateTaskInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const insertData: TablesInsert<'tasks'> = {
							title: input.title,
							description: input.description,
							project_id: input.project_id,
							status: input.status ?? 'backlog',
							planned_for: input.planned_for,
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

			getTasksAsync: (query?: TaskQueryInput) =>
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
							queryBuilder = queryBuilder.eq('planned_for', query.planned_for);
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

			updateTaskAsync: (id: string, input: UpdateTaskInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'tasks'> = {};

						if (input.title !== undefined) updateData.title = input.title;
						if (input.description !== undefined) updateData.description = input.description;
						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.status !== undefined) updateData.status = input.status;
						if (input.planned_for !== undefined) updateData.planned_for = input.planned_for;
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

			moveTaskToProjectAsync: (input: MoveTaskToProjectInput) =>
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
