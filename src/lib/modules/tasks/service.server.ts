import { DateTime, Effect, HashSet } from 'effect';
import * as Supabase from '../supabase/index.server';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import { TaskQuerySchema, TaskSchema, TaskInsertSchema, TaskUpdateSchema } from './types';
import { NotFound, InvalidProject, InvalidSession, HasDependencies } from './errors';

/**
 * 태스크 데이터의 생성, 조회, 수정, 삭제를 관리한다
 */
export class Service extends Effect.Service<Service>()('TaskService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * 새로운 태스크을 생성한다
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
			 * 태스크을 삭제한다
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
			 * 특정 태스크의 상세 정보를 조회한다
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
			 * 오늘 계획된 태스크 목록을 조회한다
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
			 * 조건에 맞는 태스크 목록을 조회한다
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
						const dateString = `${decodedQuery.date_start.getFullYear()}-${String(decodedQuery.date_start.getMonth() + 1).padStart(2, '0')}-${String(decodedQuery.date_start.getDate()).padStart(2, '0')}`;
						queryBuilder = queryBuilder.gte('planned_for', dateString);
					}

					if (decodedQuery.date_end) {
						const dateString = `${decodedQuery.date_end.getFullYear()}-${String(decodedQuery.date_end.getMonth() + 1).padStart(2, '0')}-${String(decodedQuery.date_end.getDate()).padStart(2, '0')}`;
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
			 * 기존 태스크의 정보를 수정한다
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
