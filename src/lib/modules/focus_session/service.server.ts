import {
	mapPostgrestError,
	SupabasePostgrestError,
	createActiveFocusSessionExistsError,
	createFocusSessionNotFoundError,
	createFocusSessionAlreadyEndedError,
	type DomainError
} from '$lib/shared/errors';
import { Context, Effect, Layer } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import { TaskService } from '$lib/modules/task/service.server';
import {
	type CreateFocusSessionInput,
	type UpdateFocusSessionInput,
	type StartFocusSessionInput,
	type EndFocusSessionInput,
	type FocusSessionQueryInput,
	type AddTaskToSessionInput,
	type RemoveTaskFromSessionInput,
	type UpdateSessionTaskInput,
	type ReorderSessionTasksInput
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';

export type FocusSession = Tables<'focus_sessions'>;
export type SessionTaskDB = Tables<'session_tasks'>;
export type FocusSessionWithTasks = FocusSession & {
	session_tasks: SessionTaskDB[];
};

export class FocusSessionService extends Context.Tag('FocusSession')<
	FocusSessionService,
	{
		/**
		 * Creates a new focus session.
		 *
		 * @param input - The focus session creation parameters
		 * @returns Effect that succeeds with the created FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail (connection, constraint violations, etc.)
		 * @throws {ActiveFocusSessionExistsError} When user already has an active focus session
		 * @throws {ProjectNotFoundError} When specified project_id doesn't exist or user lacks access
		 * @throws {TaskNotFoundError} When any of the specified task_ids don't exist or user lacks access
		 * @throws {InvalidTaskStatusTransitionError} When tasks are not in a valid state for focus session
		 */
		readonly createFocusSessionAsync: (
			input: CreateFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;
		readonly getFocusSessionByIdAsync: (
			id: string
		) => Effect.Effect<FocusSession | null, SupabasePostgrestError>;
		readonly getFocusSessionWithTasksByIdAsync: (
			id: string
		) => Effect.Effect<FocusSessionWithTasks | null, SupabasePostgrestError>;
		readonly getFocusSessionsAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		readonly getFocusSessionsWithTasksAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSessionWithTasks[], SupabasePostgrestError>;
		readonly getActiveFocusSessionAsync: () => Effect.Effect<
			FocusSession | null,
			SupabasePostgrestError
		>;
		readonly getActiveFocusSessionWithTasksAsync: () => Effect.Effect<
			FocusSessionWithTasks | null,
			SupabasePostgrestError
		>;
		readonly updateFocusSessionAsync: (
			id: string,
			input: UpdateFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError>;
		/**
		 * Starts a new focus session with specified tasks and duration.
		 *
		 * @param input - The session start parameters including tasks and duration
		 * @returns Effect that succeeds with the started FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail
		 * @throws {ActiveFocusSessionExistsError} When user already has an active focus session
		 * @throws {TaskNotFoundError} When any of the specified task_ids don't exist or user lacks access
		 * @throws {InvalidTaskStatusTransitionError} When tasks cannot be transitioned to 'in_session' status
		 * @throws {ProjectNotFoundError} When specified project_id doesn't exist or user lacks access
		 */
		readonly startFocusSessionAsync: (
			input: StartFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;
		/**
		 * Ends an active focus session and updates task completion states.
		 *
		 * @param sessionId - The ID of the session to end
		 * @param input - The session completion data including task updates
		 * @returns Effect that succeeds with the ended FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail
		 * @throws {FocusSessionNotFoundError} When session doesn't exist or user lacks access
		 * @throws {FocusSessionAlreadyEndedError} When session is already closed
		 * @throws {InvalidTaskStatusTransitionError} When task status transitions are invalid
		 * @throws {TaskNotFoundError} When any task in completion updates doesn't exist
		 */
		readonly endFocusSessionAsync: (
			sessionId: string,
			input: EndFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;
		readonly deleteFocusSessionAsync: (id: string) => Effect.Effect<void, SupabasePostgrestError>;
		readonly addTaskToSessionAsync: (
			input: AddTaskToSessionInput
		) => Effect.Effect<SessionTaskDB, SupabasePostgrestError>;
		readonly removeTaskFromSessionAsync: (
			input: RemoveTaskFromSessionInput
		) => Effect.Effect<void, SupabasePostgrestError>;
		readonly updateSessionTaskAsync: (
			input: UpdateSessionTaskInput
		) => Effect.Effect<SessionTaskDB, SupabasePostgrestError>;
		readonly reorderSessionTasksAsync: (
			input: ReorderSessionTasksInput
		) => Effect.Effect<void, SupabasePostgrestError>;
		readonly getSessionTasksAsync: (
			sessionId: string
		) => Effect.Effect<SessionTaskDB[], SupabasePostgrestError>;
		readonly getSessionsByTaskIdAsync: (
			taskId: string
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		readonly calculateSessionDurationSync: (session: FocusSession) => Effect.Effect<number, never>; // returns duration in minutes
	}
>() {}

export const FocusSessionLive = Layer.effect(
	FocusSessionService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const taskService = yield* TaskService;

		return {
			createFocusSessionAsync: (input: CreateFocusSessionInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					// Create the focus session
					const insertData: TablesInsert<'focus_sessions'> = {
						project_id: input.project_id,
						started_at: input.started_at,
						scheduled_end_at: input.scheduled_end_at
					};

					const session = yield* Effect.promise(() =>
						client.from('focus_sessions').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					// Associate tasks if provided
					if (input.task_ids && input.task_ids.length > 0) {
						const sessionTaskInserts = input.task_ids.map((taskId, index) => ({
							session_id: session.id,
							task_id: taskId,
							order_index: index + 1
						}));

						yield* Effect.promise(() =>
							client.from('session_tasks').insert(sessionTaskInserts)
						).pipe(
							Effect.flatMap((res) =>
								res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
							)
						);
					}

					return session;
				}),

			getFocusSessionByIdAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getFocusSessionWithTasksByIdAsync: (id: string) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					const session = yield* Effect.promise(() =>
						client.from('focus_sessions').select().eq('id', id).maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (!session) {
						return null;
					}

					const sessionTasks = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select()
							.eq('session_id', id)
							.order('order_index', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					return { ...session, session_tasks: sessionTasks };
				}),

			getFocusSessionsAsync: (query?: FocusSessionQueryInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						let queryBuilder = client.from('focus_sessions').select();

						if (query?.project_id) {
							queryBuilder = queryBuilder.eq('project_id', query.project_id);
						}

						// Note: task_id filtering will be handled post-query due to Supabase limitations

						if (query?.date_from) {
							queryBuilder = queryBuilder.gte('started_at', query.date_from);
						}

						if (query?.date_to) {
							queryBuilder = queryBuilder.lte('started_at', query.date_to);
						}

						if (query?.is_active !== undefined) {
							if (query.is_active) {
								queryBuilder = queryBuilder.is('closed_at', null);
							} else {
								queryBuilder = queryBuilder.not('closed_at', 'is', null);
							}
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

						queryBuilder = queryBuilder.order('started_at', { ascending: false });

						return Effect.promise(() => queryBuilder);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getFocusSessionsWithTasksAsync: (query?: FocusSessionQueryInput) =>
				Effect.gen(function* () {
					// Get sessions first (avoiding circular dependency)
					const client = yield* supabase.getClientSync();
					let queryBuilder = client.from('focus_sessions').select();

					if (query?.project_id) {
						queryBuilder = queryBuilder.eq('project_id', query.project_id);
					}

					if (query?.date_from) {
						queryBuilder = queryBuilder.gte('started_at', query.date_from);
					}

					if (query?.date_to) {
						queryBuilder = queryBuilder.lte('started_at', query.date_to);
					}

					if (query?.is_active !== undefined) {
						if (query.is_active) {
							queryBuilder = queryBuilder.is('closed_at', null);
						} else {
							queryBuilder = queryBuilder.not('closed_at', 'is', null);
						}
					}

					if (query?.limit) {
						queryBuilder = queryBuilder.limit(query.limit);
					}

					if (query?.offset) {
						queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit ?? 50) - 1);
					}

					queryBuilder = queryBuilder.order('started_at', { ascending: false });

					const sessions = yield* Effect.promise(() => queryBuilder).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (sessions.length === 0) {
						return [];
					}

					const sessionIds = sessions.map((s) => s.id);

					const allSessionTasks = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select()
							.in('session_id', sessionIds)
							.order('order_index', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					// Filter by task_id if provided
					let filteredSessions = sessions;
					if (query?.task_id) {
						const sessionIdsWithTask = allSessionTasks
							.filter((st) => st.task_id === query.task_id)
							.map((st) => st.session_id);
						filteredSessions = sessions.filter((s) => sessionIdsWithTask.includes(s.id));
					}

					// Group session tasks by session_id
					const sessionTasksMap = allSessionTasks.reduce(
						(acc, st) => {
							if (!acc[st.session_id]) {
								acc[st.session_id] = [];
							}
							acc[st.session_id].push(st);
							return acc;
						},
						{} as Record<string, SessionTaskDB[]>
					);

					return filteredSessions.map((session) => ({
						...session,
						session_tasks: sessionTasksMap[session.id] || []
					}));
				}),

			getActiveFocusSessionAsync: () =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('focus_sessions')
								.select()
								.is('closed_at', null)
								.order('started_at', { ascending: false })
								.limit(1)
								.maybeSingle()
						)
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getActiveFocusSessionWithTasksAsync: () =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();
					const activeSession = yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.select()
							.is('closed_at', null)
							.order('started_at', { ascending: false })
							.limit(1)
							.maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (!activeSession) {
						return null;
					}

					const sessionTasks = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select()
							.eq('session_id', activeSession.id)
							.order('order_index', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					return { ...activeSession, session_tasks: sessionTasks };
				}),

			updateFocusSessionAsync: (id: string, input: UpdateFocusSessionInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'focus_sessions'> = {};

						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.started_at !== undefined) updateData.started_at = input.started_at;
						if (input.scheduled_end_at !== undefined)
							updateData.scheduled_end_at = input.scheduled_end_at;
						if (input.closed_at !== undefined) updateData.closed_at = input.closed_at;

						return Effect.promise(() =>
							client.from('focus_sessions').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			startFocusSessionAsync: (input: StartFocusSessionInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					// Check if there's already an active session
					const activeSession = yield* Effect.promise(() =>
						client.from('focus_sessions').select().is('closed_at', null).maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (activeSession) {
						return yield* Effect.fail(createActiveFocusSessionExistsError());
					}

					// Calculate scheduled end time
					const now = new Date();
					const durationMinutes = input.scheduled_duration_minutes ?? 50;
					const scheduledEndAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

					// Create new focus session
					const insertData: TablesInsert<'focus_sessions'> = {
						project_id: input.project_id,
						started_at: now.toISOString(),
						scheduled_end_at: scheduledEndAt.toISOString()
					};

					const session = yield* Effect.promise(() =>
						client.from('focus_sessions').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					// Associate tasks if provided
					if (input.task_ids && input.task_ids.length > 0) {
						const sessionTaskInserts = input.task_ids.map((taskId, index) => ({
							session_id: session.id,
							task_id: taskId,
							order_index: index + 1
						}));

						yield* Effect.promise(() =>
							client.from('session_tasks').insert(sessionTaskInserts)
						).pipe(
							Effect.flatMap((res) =>
								res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
							)
						);

						// Update task statuses to in_session
						yield* Effect.all(
							input.task_ids.map((taskId) =>
								taskService.updateTaskStatusAsync(taskId, 'in_session')
							),
							{ concurrency: 'unbounded' }
						);
					}

					return session;
				}),

			endFocusSessionAsync: (sessionId: string, input: EndFocusSessionInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();
					const now = new Date().toISOString();

					// Get the session to validate it exists and is active
					const session = yield* Effect.promise(() =>
						client.from('focus_sessions').select().eq('id', sessionId).maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (!session) {
						return yield* Effect.fail(createFocusSessionNotFoundError(sessionId));
					}

					if (session.closed_at) {
						return yield* Effect.fail(createFocusSessionAlreadyEndedError(sessionId));
					}

					// Get session tasks
					const sessionTasks = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select()
							.eq('session_id', sessionId)
							.order('order_index', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					// Update session task time tracking and completion updates
					if (input.task_completion_updates && input.task_completion_updates.length > 0) {
						yield* Effect.all(
							input.task_completion_updates.map((update) =>
								Effect.gen(function* () {
									// Update session task time if provided
									if (update.seconds_spent !== undefined) {
										yield* Effect.promise(() =>
											client
												.from('session_tasks')
												.update({ seconds_spent: update.seconds_spent })
												.eq('session_id', sessionId)
												.eq('task_id', update.task_id)
										).pipe(
											Effect.flatMap((res) =>
												res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
											)
										);
									}

									// Update task status based on completion
									const newStatus = update.completed ? 'completed' : 'planned';
									yield* taskService.updateTaskStatusAsync(update.task_id, newStatus);
								})
							),
							{ concurrency: 'unbounded' }
						);
					} else {
						// If no specific updates provided, set all session tasks back to 'planned'
						yield* Effect.all(
							sessionTasks.map((st) => taskService.updateTaskStatusAsync(st.task_id, 'planned')),
							{ concurrency: 'unbounded' }
						);
					}

					// Update focus session with close time
					return yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.update({ closed_at: now })
							.eq('id', sessionId)
							.select()
							.single()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);
				}),

			deleteFocusSessionAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').delete().eq('id', id))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
					)
				),

			addTaskToSessionAsync: (input: AddTaskToSessionInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					// If no order_index provided, set it to the last position
					let orderIndex = input.order_index;
					if (orderIndex === undefined) {
						const maxOrder = yield* Effect.promise(() =>
							client
								.from('session_tasks')
								.select('order_index')
								.eq('session_id', input.session_id)
								.order('order_index', { ascending: false })
								.limit(1)
								.maybeSingle()
						).pipe(
							Effect.flatMap((res) =>
								res.error
									? Effect.fail(mapPostgrestError(res.error))
									: Effect.succeed(res.data?.order_index || 0)
							)
						);
						orderIndex = maxOrder + 1;
					}

					const insertData = {
						session_id: input.session_id,
						task_id: input.task_id,
						order_index: orderIndex
					};

					return yield* Effect.promise(() =>
						client.from('session_tasks').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);
				}),

			removeTaskFromSessionAsync: (input: RemoveTaskFromSessionInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('session_tasks')
								.delete()
								.eq('session_id', input.session_id)
								.eq('task_id', input.task_id)
						)
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
					)
				),

			updateSessionTaskAsync: (input: UpdateSessionTaskInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: Partial<Tables<'session_tasks'>> = {};
						if (input.order_index !== undefined) updateData.order_index = input.order_index;
						if (input.seconds_spent !== undefined) updateData.seconds_spent = input.seconds_spent;

						return Effect.promise(() =>
							client
								.from('session_tasks')
								.update(updateData)
								.eq('session_id', input.session_id)
								.eq('task_id', input.task_id)
								.select()
								.single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			reorderSessionTasksAsync: (input: ReorderSessionTasksInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					yield* Effect.all(
						input.task_order.map((taskOrder) =>
							Effect.promise(() =>
								client
									.from('session_tasks')
									.update({ order_index: taskOrder.order_index })
									.eq('session_id', input.session_id)
									.eq('task_id', taskOrder.task_id)
							).pipe(
								Effect.flatMap((res) =>
									res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
								)
							)
						),
						{ concurrency: 'unbounded' }
					);
				}),

			getSessionTasksAsync: (sessionId: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('session_tasks')
								.select()
								.eq('session_id', sessionId)
								.order('order_index', { ascending: true })
						)
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getSessionsByTaskIdAsync: (taskId: string) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					const sessionIds = yield* Effect.promise(() =>
						client.from('session_tasks').select('session_id').eq('task_id', taskId)
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error))
								: Effect.succeed(res.data.map((st) => st.session_id))
						)
					);

					if (sessionIds.length === 0) {
						return [];
					}

					return yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.select()
							.in('id', sessionIds)
							.order('started_at', { ascending: false })
					).pipe(
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);
				}),

			calculateSessionDurationSync: (session: FocusSession) =>
				Effect.succeed(
					(() => {
						const startTime = new Date(session.started_at);
						const endTime = session.closed_at ? new Date(session.closed_at) : new Date();
						return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
					})()
				)
		};
	})
);
