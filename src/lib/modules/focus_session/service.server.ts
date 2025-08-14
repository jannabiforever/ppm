import { mapPostgrestError, SupabasePostgrestError, type DomainError } from '$lib/shared/errors';
import { Context, Effect, Layer, DateTime, Duration, Option } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import { TaskService } from '$lib/modules/task/service.server';
import {
	type CreateFocusSessionInput,
	type UpdateFocusSessionInput,
	type StartFocusSessionInput,
	type EndFocusSessionInput,
	type FocusSessionQueryInput,
	type AddTaskToSessionInput,
	type RemoveTaskFromSessionInput
} from './schema';
import type { Tables, TablesInsert, TablesUpdate, Database } from '$lib/infra/supabase/types';
import {
	ActiveFocusSessionExistsError,
	FocusSessionAlreadyEndedError,
	FocusSessionNotFoundError
} from './errors';

export type FocusSession = Tables<'focus_sessions'>;
export type SessionTaskDB = Tables<'session_tasks'>;
export type Task = Tables<'tasks'>;

// Enhanced type that includes full task information with deduplicated fields
export type FocusSessionWithTasks = FocusSession & {
	tasks: Array<Omit<SessionTaskDB, 'task_id' | 'session_id'> & Omit<Task, 'project_id'>>;
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
		) => Effect.Effect<Option.Option<FocusSession>, SupabasePostgrestError>;
		readonly getFocusSessionWithTasksByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<FocusSessionWithTasks>, SupabasePostgrestError>;
		readonly getFocusSessionsAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		readonly getFocusSessionsWithTasksAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSessionWithTasks[], SupabasePostgrestError>;
		readonly getActiveFocusSessionAsync: () => Effect.Effect<
			Option.Option<FocusSession>,
			SupabasePostgrestError
		>;
		readonly getActiveFocusSessionWithTasksAsync: () => Effect.Effect<
			Option.Option<FocusSessionWithTasks>,
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

		readonly getSessionTasksAsync: (
			sessionId: string
		) => Effect.Effect<SessionTaskDB[], SupabasePostgrestError>;
		readonly getSessionsByTaskIdAsync: (
			taskId: string
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		readonly calculateSessionDurationSync: (session: FocusSession) => Effect.Effect<number, never>; // returns duration in minutes

		// DateTime-powered utility methods
		readonly isSessionActiveSync: (session: FocusSession) => Effect.Effect<boolean, never>;
		readonly getSessionRemainingTimeSync: (
			session: FocusSession
		) => Effect.Effect<Duration.Duration, never>;
		readonly isSessionOverdueSync: (session: FocusSession) => Effect.Effect<boolean, never>;
		readonly formatSessionTimeRangeSync: (session: FocusSession) => Effect.Effect<string, never>;
		readonly extendSessionAsync: (
			sessionId: string,
			additionalMinutes: number
		) => Effect.Effect<FocusSession, SupabasePostgrestError>;
	}
>() {}

export const FocusSessionLive = Layer.effect(
	FocusSessionService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClientSync();
		const taskService = yield* TaskService;

		return {
			createFocusSessionAsync: (input: CreateFocusSessionInput) =>
				Effect.gen(function* () {
					// Create the focus session
					const insertData: TablesInsert<'focus_sessions'> = {
						project_id: input.project_id,
						started_at: input.started_at.toString(),
						scheduled_end_at: input.scheduled_end_at.toString()
					};

					const focusSession = yield* Effect.promise(() =>
						client.from('focus_sessions').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Associate tasks if provided
					if (input.task_ids && input.task_ids.length > 0) {
						const sessionTaskInserts = input.task_ids.map((taskId) => ({
							session_id: focusSession.id,
							task_id: taskId
						}));

						yield* Effect.promise(() =>
							client.from('session_tasks').insert(sessionTaskInserts)
						).pipe(
							Effect.flatMap((res) =>
								res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
							)
						);
					}

					return focusSession;
				}),

			getFocusSessionByIdAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getFocusSessionWithTasksByIdAsync: (id: string) =>
				Effect.gen(function* () {
					const focusSession = yield* Effect.promise(() =>
						client.from('focus_sessions').select().eq('id', id).maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(Option.fromNullable(res.data))
						)
					);

					if (Option.isNone(focusSession)) return Option.none();

					const sessionTasksWithDetails = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select(
								`
								session_id,
								added_at,
								tasks!inner(
									id,
									title,
									description,
									status,
									owner_id,
									blocked_note,
									planned_for,
									created_at,
									updated_at
								)
							`
							)
							.eq('session_id', id)
							.order('added_at', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Transform the data to match our FocusSessionWithTasks type
					const tasks = sessionTasksWithDetails.map(
						(item: {
							session_id: string;
							added_at: string;
							tasks: {
								id: string;
								title: string;
								description: string | null;
								status: Database['public']['Enums']['task_status'];
								owner_id: string;
								blocked_note: string | null;
								planned_for: string | null;
								created_at: string;
								updated_at: string;
							};
						}) => ({
							added_at: item.added_at,
							id: item.tasks.id,
							title: item.tasks.title,
							description: item.tasks.description,
							status: item.tasks.status,
							owner_id: item.tasks.owner_id,
							blocked_note: item.tasks.blocked_note,
							planned_for: item.tasks.planned_for,
							created_at: item.tasks.created_at,
							updated_at: item.tasks.updated_at
						})
					);

					return Option.map(focusSession, (focusSession) => {
						return { ...focusSession, tasks };
					});
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
							queryBuilder = queryBuilder.gte('started_at', DateTime.formatIso(query.date_from));
						}

						if (query?.date_to) {
							queryBuilder = queryBuilder.lte('started_at', DateTime.formatIso(query.date_to));
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
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			getFocusSessionsWithTasksAsync: (query?: FocusSessionQueryInput) =>
				Effect.gen(function* () {
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					if (sessions.length === 0) {
						return [];
					}

					const sessionIds = sessions.map((s) => s.id);

					const allSessionTasksWithDetails = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select(
								`
								session_id,
								added_at,
								tasks!inner(
									id,
									title,
									description,
									status,
									owner_id,
									blocked_note,
									planned_for,
									created_at,
									updated_at
								)
							`
							)
							.in('session_id', sessionIds)
							.order('added_at', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Filter by task_id if provided
					let filteredSessions = sessions;
					if (query?.task_id) {
						const sessionIdsWithTask = allSessionTasksWithDetails
							.filter(
								(item: { session_id: string; tasks: { id: string } }) =>
									item.tasks.id === query.task_id
							)
							.map((item: { session_id: string }) => item.session_id);
						filteredSessions = sessions.filter((s) => sessionIdsWithTask.includes(s.id));
					}

					// Transform and group session tasks by session_id
					const sessionTasksMap = allSessionTasksWithDetails.reduce(
						(
							acc,
							item: {
								session_id: string;
								added_at: string;
								tasks: {
									id: string;
									title: string;
									description: string | null;
									status: Database['public']['Enums']['task_status'];
									owner_id: string;
									blocked_note: string | null;
									planned_for: string | null;
									created_at: string;
									updated_at: string;
								};
							}
						) => {
							const transformedTask = {
								added_at: item.added_at,
								id: item.tasks.id,
								title: item.tasks.title,
								description: item.tasks.description,
								status: item.tasks.status,
								owner_id: item.tasks.owner_id,
								blocked_note: item.tasks.blocked_note,
								planned_for: item.tasks.planned_for,
								created_at: item.tasks.created_at,
								updated_at: item.tasks.updated_at
							};

							if (!acc[item.session_id]) {
								acc[item.session_id] = [];
							}
							acc[item.session_id].push(transformedTask);
							return acc;
						},
						{} as Record<
							string,
							Array<Omit<SessionTaskDB, 'task_id' | 'session_id'> & Omit<Task, 'project_id'>>
						>
					);

					return filteredSessions.map((session) => ({
						...session,
						tasks: sessionTasksMap[session.id] || []
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
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getActiveFocusSessionWithTasksAsync: () =>
				Effect.gen(function* () {
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(Option.fromNullable(res.data))
						)
					);

					if (Option.isNone(activeSession)) return Option.none();

					const sessionTasksWithDetails = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select(
								`
								session_id,
								added_at,
								tasks!inner(
									id,
									title,
									description,
									status,
									owner_id,
									blocked_note,
									planned_for,
									created_at,
									updated_at
								)
							`
							)
							.eq('session_id', activeSession.value.id)
							.order('added_at', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Transform the data to match our FocusSessionWithTasks type
					const tasks = sessionTasksWithDetails.map(
						(item: {
							session_id: string;
							added_at: string;
							tasks: {
								id: string;
								title: string;
								description: string | null;
								status: Database['public']['Enums']['task_status'];
								owner_id: string;
								blocked_note: string | null;
								planned_for: string | null;
								created_at: string;
								updated_at: string;
							};
						}) => ({
							added_at: item.added_at,
							id: item.tasks.id,
							title: item.tasks.title,
							description: item.tasks.description,
							status: item.tasks.status,
							owner_id: item.tasks.owner_id,
							blocked_note: item.tasks.blocked_note,
							planned_for: item.tasks.planned_for,
							created_at: item.tasks.created_at,
							updated_at: item.tasks.updated_at
						})
					);

					return Option.map(activeSession, (activeSession) => {
						return { ...activeSession, tasks };
					});
				}),

			updateFocusSessionAsync: (id: string, input: UpdateFocusSessionInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'focus_sessions'> = {};

						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.started_at !== undefined)
							updateData.started_at = DateTime.formatIso(input.started_at);
						if (input.scheduled_end_at !== undefined)
							updateData.scheduled_end_at = DateTime.formatIso(input.scheduled_end_at);
						if (input.closed_at !== undefined)
							updateData.closed_at = DateTime.formatIso(input.closed_at);

						return Effect.promise(() =>
							client.from('focus_sessions').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					if (activeSession) {
						return yield* Effect.fail(new ActiveFocusSessionExistsError());
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Associate tasks if provided
					if (input.task_ids && input.task_ids.length > 0) {
						const sessionTaskInserts = input.task_ids.map((taskId) => ({
							session_id: session.id,
							task_id: taskId
						}));

						yield* Effect.promise(() =>
							client.from('session_tasks').insert(sessionTaskInserts)
						).pipe(
							Effect.flatMap((res) =>
								res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					if (!session) {
						return yield* Effect.fail(new FocusSessionNotFoundError(sessionId));
					}

					if (session.closed_at) {
						return yield* Effect.fail(new FocusSessionAlreadyEndedError(sessionId));
					}

					// Get session tasks
					const sessionTasks = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select()
							.eq('session_id', sessionId)
							.order('added_at', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Update task completion status
					if (input.task_completion_updates && input.task_completion_updates.length > 0) {
						yield* Effect.all(
							input.task_completion_updates.map((update) =>
								Effect.gen(function* () {
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);
				}),

			deleteFocusSessionAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').delete().eq('id', id))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
					)
				),

			addTaskToSessionAsync: (input: AddTaskToSessionInput) =>
				Effect.gen(function* () {
					const client = yield* supabase.getClientSync();

					const insertData = {
						session_id: input.session_id,
						task_id: input.task_id
					};

					return yield* Effect.promise(() =>
						client.from('session_tasks').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
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
						res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
					)
				),

			getSessionTasksAsync: (sessionId: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('session_tasks')
								.select()
								.eq('session_id', sessionId)
								.order('added_at', { ascending: true })
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
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
								? Effect.fail(mapPostgrestError(res.error, res.status))
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
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);
				}),

			calculateSessionDurationSync: (session: FocusSession) =>
				Effect.succeed(
					(() => {
						const startTime = DateTime.unsafeMake(session.started_at);
						const endTime = session.closed_at
							? DateTime.unsafeMake(session.closed_at)
							: DateTime.unsafeNow();
						return Math.floor(DateTime.distance(startTime, endTime) / (1000 * 60)); // minutes
					})()
				),

			// DateTime-powered utility methods
			isSessionActiveSync: (session: FocusSession) => Effect.succeed(session.closed_at === null),

			getSessionRemainingTimeSync: (session: FocusSession) =>
				Effect.succeed(
					(() => {
						const now = DateTime.unsafeNow();
						const scheduledEnd = DateTime.unsafeMake(session.scheduled_end_at);
						const remainingMs = DateTime.distance(now, scheduledEnd);

						return remainingMs > 0 ? Duration.millis(remainingMs) : Duration.zero;
					})()
				),

			isSessionOverdueSync: (session: FocusSession) =>
				Effect.succeed(
					(() => {
						if (session.closed_at !== null) return false; // closed sessions can't be overdue

						const now = DateTime.unsafeNow();
						const scheduledEnd = DateTime.unsafeMake(session.scheduled_end_at);
						return DateTime.greaterThan(now, scheduledEnd);
					})()
				),

			formatSessionTimeRangeSync: (session: FocusSession) =>
				Effect.succeed(
					(() => {
						const start = DateTime.unsafeMake(session.started_at);
						const end = session.closed_at
							? DateTime.unsafeMake(session.closed_at)
							: DateTime.unsafeMake(session.scheduled_end_at);

						const formatter = new Intl.DateTimeFormat('ko-KR', {
							hour: '2-digit',
							minute: '2-digit',
							timeZone: 'Asia/Seoul'
						});

						const startFormatted = DateTime.formatIntl(start, formatter);
						const endFormatted = DateTime.formatIntl(end, formatter);

						return `${startFormatted} - ${endFormatted}`;
					})()
				),

			extendSessionAsync: (sessionId: string, additionalMinutes: number) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client.from('focus_sessions').select('scheduled_end_at').eq('id', sessionId).single()
						)
					),
					Effect.flatMap((res) => {
						if (res.error) {
							return Effect.fail(mapPostgrestError(res.error, res.status));
						}

						const currentEnd = DateTime.unsafeMake(res.data.scheduled_end_at);
						const newEnd = DateTime.add(currentEnd, { minutes: additionalMinutes });
						const newEndIso = DateTime.formatIso(newEnd);

						return Effect.promise(() =>
							client
								.from('focus_sessions')
								.update({ scheduled_end_at: newEndIso })
								.eq('id', sessionId)
								.select()
								.single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				)
		};
	})
);
