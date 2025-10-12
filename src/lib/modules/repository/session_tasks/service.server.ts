import { DateTime, Effect, Option } from 'effect';
import * as S from 'effect/Schema';
import * as Supabase from '../../infra/supabase/index.server';
import { PaginationQuerySchema } from '$lib/shared/pagination';
import { TaskAlreadyInSessionError, TaskNotInSessionError } from './errors';
import { SessionTaskSchema } from './types';

/**
 * Service class for managing the relationship between focus sessions and tasks.
 * Provides methods for adding/removing tasks from sessions and querying session-task associations.
 */
export class Service extends Effect.Service<Service>()('SessionTaskRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		// 1. Session-Task Association Management

		const addTaskToSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				// Check if already added
				const existing = yield* getSessionTask(params);
				if (Option.isSome(existing)) {
					return yield* Effect.fail(
						new TaskAlreadyInSessionError({
							taskId: params.task_id,
							sessionId: params.session_id
						})
					);
				}

				// Add the task
				const data = {
					session_id: params.session_id,
					task_id: params.task_id
				};

				return yield* Effect.promise(() => client.from('session_tasks').insert(data).select()).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.asVoid
				);
			});

		const removeTaskFromSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				// Check if exists
				const existing = yield* getSessionTask(params);
				if (Option.isNone(existing)) {
					return yield* Effect.fail(
						new TaskNotInSessionError({
							taskId: params.task_id,
							sessionId: params.session_id
						})
					);
				}

				// Remove the task
				return yield* Effect.promise(() =>
					client
						.from('session_tasks')
						.delete()
						.eq('session_id', params.session_id)
						.eq('task_id', params.task_id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse), Effect.asVoid);
			});

		const addTasksToSession = (params: { session_id: string; task_ids: readonly string[] }) =>
			Effect.gen(function* () {
				// Check existing tasks
				const existingTasks = yield* getTasksBySession(params.session_id);
				const existingTaskIds = new Set(existingTasks.map((st) => st.task_id));

				// Filter only new tasks to add
				const newTaskIds = params.task_ids.filter((id) => !existingTaskIds.has(id));

				if (newTaskIds.length === 0) {
					return;
				}

				// Bulk insert
				const data = newTaskIds.map((task_id) => ({
					session_id: params.session_id,
					task_id
				}));

				return yield* Effect.promise(() => client.from('session_tasks').insert(data)).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.asVoid
				);
			});

		const clearSessionTasks = (session_id: string) =>
			Effect.promise(() => client.from('session_tasks').delete().eq('session_id', session_id)).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.asVoid
			);

		// 2. Query Functions

		const getTasksBySession = (
			session_id: string,
			pagination?: S.Schema.Type<typeof PaginationQuerySchema>
		) =>
			Effect.gen(function* () {
				let query = client
					.from('session_tasks')
					.select('*')
					.eq('session_id', session_id)
					.order('added_at', { ascending: false });

				if (pagination) {
					query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
				}

				return yield* Effect.promise(() => query).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((tasks) =>
						Effect.all(tasks.map((task) => S.decode(SessionTaskSchema)(task).pipe(Effect.orDie)))
					)
				);
			});

		const getSessionsByTask = (
			task_id: string,
			pagination?: S.Schema.Type<typeof PaginationQuerySchema>
		) =>
			Effect.gen(function* () {
				let query = client
					.from('session_tasks')
					.select('*')
					.eq('task_id', task_id)
					.order('added_at', { ascending: false });

				if (pagination) {
					query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);
				}

				return yield* Effect.promise(() => query).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((sessions) =>
						Effect.all(
							sessions.map((session) => S.decode(SessionTaskSchema)(session).pipe(Effect.orDie))
						)
					)
				);
			});

		const getSessionTask = (params: { session_id: string; task_id: string }) =>
			Effect.promise(() =>
				client
					.from('session_tasks')
					.select('*')
					.eq('session_id', params.session_id)
					.eq('task_id', params.task_id)
					.limit(1)
					.maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap((option) =>
					Option.match(option, {
						onNone: () => Effect.succeed(Option.none()),
						onSome: (task) =>
							S.decode(SessionTaskSchema)(task).pipe(Effect.map(Option.some), Effect.orDie)
					})
				)
			);

		const getActiveSessionTasks = () =>
			Effect.gen(function* () {
				// Find current active session
				const now = DateTime.formatIso(DateTime.unsafeNow());
				const sessionResult = yield* Effect.promise(() =>
					client
						.from('focus_sessions')
						.select('id')
						.lte('start_at', now)
						.gte('end_at', now)
						.limit(1)
						.maybeSingle()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseOptional));

				if (Option.isNone(sessionResult)) {
					return [];
				}

				return yield* getTasksBySession(sessionResult.value.id);
			});

		const getSessionTasksInRange = (params: {
			from_date: S.Schema.Type<typeof S.DateTimeUtc>;
			to_date: S.Schema.Type<typeof S.DateTimeUtc>;
			pagination?: S.Schema.Type<typeof PaginationQuerySchema>;
		}) =>
			Effect.gen(function* () {
				let query = client
					.from('session_tasks')
					.select('*')
					.gte('added_at', DateTime.formatIso(params.from_date))
					.lte('added_at', DateTime.formatIso(params.to_date))
					.order('added_at', { ascending: false });

				if (params.pagination) {
					query = query.range(
						params.pagination.offset,
						params.pagination.offset + params.pagination.limit - 1
					);
				}

				return yield* Effect.promise(() => query).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((tasks) =>
						Effect.all(tasks.map((task) => S.decode(SessionTaskSchema)(task).pipe(Effect.orDie)))
					)
				);
			});

		// 3. Validation and Business Logic

		const isTaskInSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				const result = yield* getSessionTask(params);
				return Option.isSome(result);
			});

		const isTaskInActiveSession = (task_id: string) =>
			Effect.gen(function* () {
				// Find current active session
				const now = DateTime.formatIso(DateTime.unsafeNow());
				const result = yield* Effect.promise(() =>
					client
						.from('session_tasks')
						.select('*, focus_sessions!inner(*)')
						.eq('task_id', task_id)
						.lte('focus_sessions.start_at', now)
						.gte('focus_sessions.end_at', now)
						.limit(1)
						.maybeSingle()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseOptional));

				return Option.isSome(result);
			});

		const getSessionTaskCount = (session_id: string) =>
			Effect.gen(function* () {
				const result = yield* Effect.promise(() =>
					client
						.from('session_tasks')
						.select('*', { count: 'exact', head: true })
						.eq('session_id', session_id)
				);

				if (result.error) {
					return yield* Effect.fail(new Supabase.PostgrestError(result.error, result.status));
				}

				return result.count ?? 0;
			});

		return {
			// Session-Task Association Management
			/**
			 * Adds a task to a focus session.
			 * Checks if the task is already in the session before adding.
			 *
			 * @param params - Object containing session_id and task_id
			 * @returns Effect containing void or an error
			 * @throws {TaskAlreadyInSessionError} When the task is already in the session
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			addTaskToSession,
			/**
			 * Removes a task from a focus session.
			 * Checks if the task exists in the session before removing.
			 *
			 * @param params - Object containing session_id and task_id
			 * @returns Effect containing void or an error
			 * @throws {TaskNotInSessionError} When the task is not in the session
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			removeTaskFromSession,
			/**
			 * Adds multiple tasks to a focus session in bulk.
			 * Filters out tasks that are already in the session.
			 *
			 * @param params - Object containing session_id and an array of task_ids
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			addTasksToSession,
			/**
			 * Removes all tasks from a focus session.
			 *
			 * @param session_id - The ID of the session to clear
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			clearSessionTasks,

			// Query Functions
			/**
			 * Retrieves all tasks associated with a specific session.
			 * Results are ordered by added_at in descending order.
			 *
			 * @param session_id - The ID of the session
			 * @param pagination - Optional pagination parameters
			 * @returns Effect containing an array of SessionTask objects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getTasksBySession,
			/**
			 * Retrieves all sessions that contain a specific task.
			 * Results are ordered by added_at in descending order.
			 *
			 * @param task_id - The ID of the task
			 * @param pagination - Optional pagination parameters
			 * @returns Effect containing an array of SessionTask objects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getSessionsByTask,
			/**
			 * Retrieves a specific session-task association.
			 *
			 * @param params - Object containing session_id and task_id
			 * @returns Effect containing Option of SessionTask (None if not found)
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getSessionTask,
			/**
			 * Retrieves all tasks from the currently active focus session.
			 * A session is considered active if the current time is between its start and end times.
			 *
			 * @returns Effect containing an array of SessionTask objects (empty if no active session)
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getActiveSessionTasks,
			/**
			 * Retrieves all session-task associations created within a specific date range.
			 * Results are ordered by added_at in descending order.
			 *
			 * @param params - Object containing from_date, to_date, and optional pagination
			 * @returns Effect containing an array of SessionTask objects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getSessionTasksInRange,

			// Validation and Business Logic
			/**
			 * Checks if a task is currently associated with a specific session.
			 *
			 * @param params - Object containing session_id and task_id
			 * @returns Effect containing boolean (true if task is in session)
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			isTaskInSession,
			/**
			 * Checks if a task is associated with any currently active session.
			 *
			 * @param task_id - The ID of the task to check
			 * @returns Effect containing boolean (true if task is in an active session)
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			isTaskInActiveSession,
			/**
			 * Counts the number of tasks associated with a specific session.
			 *
			 * @param session_id - The ID of the session
			 * @returns Effect containing the count of tasks
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getSessionTaskCount
		};
	})
}) {}
