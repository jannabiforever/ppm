import { DateTime, Effect, HashSet } from 'effect';
import * as Supabase from '../../infra/supabase/index.server';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import { TaskQuerySchema, TaskSchema, TaskInsertSchema, TaskUpdateSchema } from './types';
import { NotFound, InvalidProject, InvalidSession, HasDependencies } from './errors';

/**
 * Task Service
 *
 * @description
 * Manages the creation, retrieval, update, and deletion of task data.
 * This service provides a comprehensive API for task management within the application.
 */
export class Service extends Effect.Service<Service>()('TaskService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * Creates a new task
			 *
			 * @param payload - The task data to be inserted
			 * @returns A promise that resolves to the ID of the newly created task
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 * @throws {InvalidProject} When the specified project ID does not exist
			 * @throws {InvalidSession} When the specified session ID does not exist
			 */
			createTask: (
				payload: typeof TaskInsertSchema.Encoded
			): Effect.Effect<string, Supabase.PostgrestError | InvalidProject | InvalidSession> =>
				Effect.promise(() =>
					client
						.from('tasks')
						.insert({
							...payload,
							owner_id: user.id
						})
						.select('id')
						.single()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.map((res) => res.id),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<never, Supabase.PostgrestError | InvalidProject | InvalidSession> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject({ projectId: payload.project_id || '' }));
								}
								if (error.message.includes('completed_in_session_id')) {
									return Effect.fail(
										new InvalidSession({ sessionId: payload.completed_in_session_id || '' })
									);
								}
							}
							return Effect.fail(error);
						}
					)
				),

			/**
			 * Deletes an existing task
			 *
			 * @param taskId - The unique identifier of the task to delete
			 * @returns A promise that resolves to void on successful deletion
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 * @throws {NotFound} When the specified task does not exist
			 * @throws {HasDependencies} When the task cannot be deleted due to dependencies
			 */
			deleteTask: (
				taskId: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound | HasDependencies> =>
				Effect.promise(() =>
					client
						.from('tasks')
						.delete()
						.eq('id', taskId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound({ taskId })),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(error): Effect.Effect<never, Supabase.PostgrestError | HasDependencies> =>
							error.code === '23503'
								? Effect.fail(new HasDependencies({ taskId }))
								: Effect.fail(error)
					)
				),

			/**
			 * Retrieves detailed information for a specific task
			 *
			 * @param taskId - The unique identifier of the task to retrieve
			 * @returns A promise that resolves to the task data
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 * @throws {NotFound} When the specified task does not exist
			 */
			getTaskById: (
				taskId: string
			): Effect.Effect<typeof TaskSchema.Type, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client.from('tasks').select().eq('id', taskId).eq('owner_id', user.id).maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound({ taskId })),
							onSome: (task) =>
								S.decode(TaskSchema)(task).pipe(Effect.mapError(() => new NotFound({ taskId })))
						})
					)
				),

			/**
			 * Retrieves all tasks planned for today
			 *
			 * @returns A promise that resolves to an array of tasks scheduled for the current day
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 */
			getTodayTasks: (): Effect.Effect<Array<typeof TaskSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const today = yield* DateTime.nowAsDate;
					const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

					const tasks = yield* Effect.promise(() =>
						client.from('tasks').select().eq('owner_id', user.id).eq('planned_for', todayString)
					).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));

					return yield* Effect.all(
						tasks.map((task) => S.decode(TaskSchema)(task).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves tasks based on specified query parameters
			 *
			 * @param query - The query parameters to filter tasks by
			 * @returns A promise that resolves to an array of tasks matching the criteria
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 */
			getTasks: (
				query: typeof TaskQuerySchema.Encoded
			): Effect.Effect<Array<typeof TaskSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					// Schema decoding is needed for HashSet and Date types
					const decodedQuery = yield* S.decode(TaskQuerySchema)(query).pipe(Effect.orDie);

					let queryBuilder = client.from('tasks').select().eq('owner_id', user.id);

					if (decodedQuery.title_query) {
						queryBuilder = queryBuilder.ilike('title', `%${decodedQuery.title_query}%`);
					}

					if (decodedQuery.project_id !== undefined) {
						if (decodedQuery.project_id === null) {
							queryBuilder = queryBuilder.is('project_id', null);
						} else {
							queryBuilder = queryBuilder.eq('project_id', decodedQuery.project_id);
						}
					}

					if (decodedQuery.status && HashSet.size(decodedQuery.status) > 0) {
						const statusArray = Array.from(decodedQuery.status);
						queryBuilder = queryBuilder.in('status', statusArray);
					}

					if (decodedQuery.date_start) {
						const dateString = DateTime.formatIsoDate(decodedQuery.date_start);
						queryBuilder = queryBuilder.gte('planned_for', dateString);
					}

					if (decodedQuery.date_end) {
						const dateString = DateTime.formatIsoDate(decodedQuery.date_end);
						queryBuilder = queryBuilder.lte('planned_for', dateString);
					}

					const response = yield* Effect.promise(() => queryBuilder).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((task) => S.decode(TaskSchema)(task).pipe(Effect.orDie))
					);
				}),

			/**
			 * Updates an existing task with new information
			 *
			 * @param taskId - The unique identifier of the task to update
			 * @param payload - The updated task data
			 * @returns A promise that resolves to void on successful update
			 * @throws {Supabase.PostgrestError} When a database error occurs
			 * @throws {NotFound} When the specified task does not exist
			 * @throws {InvalidProject} When the specified project ID does not exist
			 * @throws {InvalidSession} When the specified session ID does not exist
			 */
			updateTask: (
				taskId: string,
				payload: typeof TaskUpdateSchema.Encoded
			): Effect.Effect<
				void,
				Supabase.PostgrestError | NotFound | InvalidProject | InvalidSession
			> =>
				Effect.promise(() =>
					client
						.from('tasks')
						.update(payload)
						.eq('id', taskId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound({ taskId })),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<never, Supabase.PostgrestError | InvalidProject | InvalidSession> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject({ projectId: payload.project_id || '' }));
								}
								if (error.message.includes('completed_in_session_id')) {
									return Effect.fail(
										new InvalidSession({ sessionId: payload.completed_in_session_id || '' })
									);
								}
							}
							// P0001 is trigger error - just pass through
							return Effect.fail(error);
						}
					)
				)
		};
	})
}) {}
