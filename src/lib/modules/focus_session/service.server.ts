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
		/**
		 * Retrieves a focus session by its unique identifier.
		 *
		 * @param id - The unique identifier of the focus session to retrieve
		 * @returns Effect that succeeds with Some(FocusSession) if found, None if not found, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * const session = yield* focusSessionService.getFocusSessionByIdAsync('session_123');
		 * if (Option.isSome(session)) {
		 *   console.log('Found session:', session.value.id);
		 * }
		 * ```
		 */
		readonly getFocusSessionByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<FocusSession>, SupabasePostgrestError>;
		/**
		 * Retrieves a focus session with its associated tasks by session ID.
		 *
		 * This method performs a join query to fetch the session along with all tasks
		 * that were added to the session, including their current status and metadata.
		 *
		 * @param id - The unique identifier of the focus session
		 * @returns Effect that succeeds with Some(FocusSessionWithTasks) if found, None if not found, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail or session access is denied
		 *
		 * @example
		 * ```typescript
		 * const sessionWithTasks = yield* focusSessionService.getFocusSessionWithTasksByIdAsync('session_123');
		 * if (Option.isSome(sessionWithTasks)) {
		 *   console.log('Session has', sessionWithTasks.value.tasks.length, 'tasks');
		 * }
		 * ```
		 */
		readonly getFocusSessionWithTasksByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<FocusSessionWithTasks>, SupabasePostgrestError>;
		/**
		 * Retrieves a list of focus sessions based on query filters.
		 *
		 * Supports filtering by date range, active status, and project association.
		 * Results are ordered by start time in descending order (most recent first).
		 *
		 * @param query - Optional query filters including date range, active status, and project ID
		 * @returns Effect that succeeds with an array of FocusSession objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * // Get all sessions
		 * const allSessions = yield* focusSessionService.getFocusSessionsAsync();
		 *
		 * // Get only active sessions
		 * const activeSessions = yield* focusSessionService.getFocusSessionsAsync({ is_active: true });
		 *
		 * // Get sessions for specific project
		 * const projectSessions = yield* focusSessionService.getFocusSessionsAsync({ project_id: 'proj_123' });
		 * ```
		 */
		readonly getFocusSessionsAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		/**
		 * Retrieves a list of focus sessions with their associated tasks based on query filters.
		 *
		 * This method performs join queries to fetch sessions along with all their tasks.
		 * Useful for dashboard views and comprehensive session analysis.
		 *
		 * @param query - Optional query filters including date range, active status, and project ID
		 * @returns Effect that succeeds with an array of FocusSessionWithTasks objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail or access is denied
		 *
		 * @example
		 * ```typescript
		 * // Get recent sessions with their tasks
		 * const sessionsWithTasks = yield* focusSessionService.getFocusSessionsWithTasksAsync({
		 *   date_from: DateTime.subtract(DateTime.unsafeNow(), { days: 7 })
		 * });
		 * ```
		 */
		readonly getFocusSessionsWithTasksAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSessionWithTasks[], SupabasePostgrestError>;
		/**
		 * Retrieves the currently active focus session for the authenticated user.
		 *
		 * An active session is one where closed_at is null. Only one session can be
		 * active per user at any given time.
		 *
		 * @returns Effect that succeeds with Some(FocusSession) if an active session exists,
		 *          None if no active session, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const activeSession = yield* focusSessionService.getActiveFocusSessionAsync();
		 * if (Option.isSome(activeSession)) {
		 *   console.log('Active session ends at:', activeSession.value.scheduled_end_at);
		 * } else {
		 *   console.log('No active session found');
		 * }
		 * ```
		 */
		readonly getActiveFocusSessionAsync: () => Effect.Effect<
			Option.Option<FocusSession>,
			SupabasePostgrestError
		>;
		/**
		 * Retrieves the currently active focus session with all its associated tasks.
		 *
		 * This is the most commonly used method for focus session UI components,
		 * as it provides complete information about the current session and its tasks.
		 *
		 * @returns Effect that succeeds with Some(FocusSessionWithTasks) if an active session exists,
		 *          None if no active session, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const activeSessionWithTasks = yield* focusSessionService.getActiveFocusSessionWithTasksAsync();
		 * if (Option.isSome(activeSessionWithTasks)) {
		 *   const session = activeSessionWithTasks.value;
		 *   console.log(`Active session has ${session.tasks.length} tasks`);
		 *   session.tasks.forEach(task => console.log(`- ${task.title} (${task.status})`));
		 * }
		 * ```
		 */
		readonly getActiveFocusSessionWithTasksAsync: () => Effect.Effect<
			Option.Option<FocusSessionWithTasks>,
			SupabasePostgrestError
		>;
		/**
		 * Updates an existing focus session with new values.
		 *
		 * Allows partial updates of session properties including project association,
		 * timing adjustments, and session closure. Only provided fields will be updated.
		 *
		 * @param id - The unique identifier of the session to update
		 * @param input - Partial update data containing fields to modify
		 * @returns Effect that succeeds with the updated FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, session not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Close a session
		 * const closedSession = yield* focusSessionService.updateFocusSessionAsync('session_123', {
		 *   closed_at: DateTime.unsafeNow()
		 * });
		 *
		 * // Change project association
		 * const updatedSession = yield* focusSessionService.updateFocusSessionAsync('session_123', {
		 *   project_id: 'new_project_id'
		 * });
		 * ```
		 */
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
		/**
		 * Permanently deletes a focus session and all its associated data.
		 *
		 * This operation removes the session record and cascades to delete all
		 * session_tasks entries. This action cannot be undone.
		 *
		 * @param id - The unique identifier of the session to delete
		 * @returns Effect that succeeds with void or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, session not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * yield* focusSessionService.deleteFocusSessionAsync('session_123');
		 * console.log('Session deleted successfully');
		 * ```
		 */
		readonly deleteFocusSessionAsync: (id: string) => Effect.Effect<void, SupabasePostgrestError>;
		/**
		 * Adds a task to an existing focus session.
		 *
		 * Creates a session_tasks relationship record linking the task to the session.
		 * The task's status may be updated to 'in_session' if specified in the input.
		 *
		 * @param input - Contains session_id, task_id, and optional status update
		 * @returns Effect that succeeds with the created SessionTaskDB record or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail or relationships are invalid
		 *
		 * @example
		 * ```typescript
		 * const sessionTask = yield* focusSessionService.addTaskToSessionAsync({
		 *   session_id: 'session_123',
		 *   task_id: 'task_456'
		 * });
		 * console.log('Task added to session at:', sessionTask.added_at);
		 * ```
		 */
		readonly addTaskToSessionAsync: (
			input: AddTaskToSessionInput
		) => Effect.Effect<SessionTaskDB, SupabasePostgrestError>;
		/**
		 * Removes a task from a focus session.
		 *
		 * Deletes the session_tasks relationship record. The task itself remains
		 * in the system but is no longer associated with the session.
		 *
		 * @param input - Contains session_id and task_id to identify the relationship to remove
		 * @returns Effect that succeeds with void or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail or relationship not found
		 *
		 * @example
		 * ```typescript
		 * yield* focusSessionService.removeTaskFromSessionAsync({
		 *   session_id: 'session_123',
		 *   task_id: 'task_456'
		 * });
		 * console.log('Task removed from session');
		 * ```
		 */
		readonly removeTaskFromSessionAsync: (
			input: RemoveTaskFromSessionInput
		) => Effect.Effect<void, SupabasePostgrestError>;

		/**
		 * Retrieves all tasks associated with a specific focus session.
		 *
		 * Returns the raw session_tasks records without full task details.
		 * For complete task information, use getFocusSessionWithTasksByIdAsync.
		 *
		 * @param sessionId - The unique identifier of the session
		 * @returns Effect that succeeds with an array of SessionTaskDB records or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or session access is denied
		 *
		 * @example
		 * ```typescript
		 * const sessionTasks = yield* focusSessionService.getSessionTasksAsync('session_123');
		 * console.log(`Session has ${sessionTasks.length} associated tasks`);
		 * sessionTasks.forEach(st => console.log(`Task ${st.task_id} added at ${st.added_at}`));
		 * ```
		 */
		readonly getSessionTasksAsync: (
			sessionId: string
		) => Effect.Effect<SessionTaskDB[], SupabasePostgrestError>;
		/**
		 * Retrieves all focus sessions that include a specific task.
		 *
		 * Finds all sessions (active and completed) that have the specified task
		 * associated with them through session_tasks relationships.
		 *
		 * @param taskId - The unique identifier of the task
		 * @returns Effect that succeeds with an array of FocusSession objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or task access is denied
		 *
		 * @example
		 * ```typescript
		 * const sessionsWithTask = yield* focusSessionService.getSessionsByTaskIdAsync('task_456');
		 * console.log(`Task appears in ${sessionsWithTask.length} sessions`);
		 * ```
		 */
		readonly getSessionsByTaskIdAsync: (
			taskId: string
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		/**
		 * Calculates the total duration of a focus session in minutes.
		 *
		 * For active sessions, calculates duration from start time to current time.
		 * For completed sessions, calculates duration from start time to close time.
		 * This is a synchronous utility method that performs no I/O.
		 *
		 * @param session - The focus session to calculate duration for
		 * @returns Effect that succeeds with duration in minutes as a number (never fails)
		 *
		 * @example
		 * ```typescript
		 * const durationMinutes = yield* focusSessionService.calculateSessionDurationSync(session);
		 * console.log(`Session lasted ${durationMinutes} minutes`);
		 * ```
		 */
		readonly calculateSessionDurationSync: (session: FocusSession) => Effect.Effect<number, never>; // returns duration in minutes

		// DateTime-powered utility methods

		/**
		 * Checks if a focus session is currently active (not yet closed).
		 *
		 * A session is considered active if its closed_at field is null.
		 * This is a synchronous utility method that performs no I/O.
		 *
		 * @param session - The focus session to check
		 * @returns Effect that succeeds with true if session is active, false if closed (never fails)
		 *
		 * @example
		 * ```typescript
		 * const isActive = yield* focusSessionService.isSessionActiveSync(session);
		 * if (isActive) {
		 *   console.log('Session is still running');
		 * }
		 * ```
		 */
		readonly isSessionActiveSync: (session: FocusSession) => Effect.Effect<boolean, never>;

		/**
		 * Calculates the remaining time until a session's scheduled end.
		 *
		 * For active sessions, calculates time remaining based on scheduled_end_at.
		 * Returns zero duration if the session is overdue or already ended.
		 *
		 * @param session - The focus session to calculate remaining time for
		 * @returns Effect that succeeds with a Duration object representing remaining time (never fails)
		 *
		 * @example
		 * ```typescript
		 * const remaining = yield* focusSessionService.getSessionRemainingTimeSync(session);
		 * const minutes = Duration.toMillis(remaining) / (1000 * 60);
		 * console.log(`${minutes} minutes remaining`);
		 * ```
		 */
		readonly getSessionRemainingTimeSync: (
			session: FocusSession
		) => Effect.Effect<Duration.Duration, never>;

		/**
		 * Checks if a focus session has exceeded its scheduled end time.
		 *
		 * A session is overdue if the current time is past its scheduled_end_at
		 * and the session is still active (closed_at is null).
		 *
		 * @param session - The focus session to check
		 * @returns Effect that succeeds with true if session is overdue, false otherwise (never fails)
		 *
		 * @example
		 * ```typescript
		 * const isOverdue = yield* focusSessionService.isSessionOverdueSync(session);
		 * if (isOverdue) {
		 *   console.warn('Session is running overtime!');
		 * }
		 * ```
		 */
		readonly isSessionOverdueSync: (session: FocusSession) => Effect.Effect<boolean, never>;

		/**
		 * Formats a session's time range as a human-readable string in Korean format.
		 *
		 * Returns a formatted string showing start time to end time (or scheduled end time
		 * for active sessions) in HH:MM format using Asia/Seoul timezone.
		 *
		 * @param session - The focus session to format
		 * @returns Effect that succeeds with formatted time range string (never fails)
		 *
		 * @example
		 * ```typescript
		 * const timeRange = yield* focusSessionService.formatSessionTimeRangeSync(session);
		 * console.log(`Session time: ${timeRange}`); // "10:00 - 11:30"
		 * ```
		 */
		readonly formatSessionTimeRangeSync: (session: FocusSession) => Effect.Effect<string, never>;

		/**
		 * Extends an active focus session by adding additional minutes to its scheduled end time.
		 *
		 * This is useful when users need more time to complete their focus session.
		 * Only active sessions can be extended.
		 *
		 * @param sessionId - The unique identifier of the session to extend
		 * @param additionalMinutes - Number of minutes to add to the scheduled end time
		 * @returns Effect that succeeds with the updated FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, session not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Extend session by 15 minutes
		 * const extendedSession = yield* focusSessionService.extendSessionAsync('session_123', 15);
		 * console.log('New end time:', extendedSession.scheduled_end_at);
		 * ```
		 */
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
						started_at: DateTime.formatIso(input.started_at),
						scheduled_end_at: DateTime.formatIso(input.scheduled_end_at)
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
