import { Effect, HashSet } from 'effect';
import * as Supabase from '../supabase';
import * as Option from 'effect/Option';
import * as S from 'effect/Schema';
import type { Task, TaskInsert, TaskQuerySchema, TaskUpdate } from './types';
import { NotFound } from './errors';

/**
 * 태스크 데이터의 생성, 조회, 수정, 삭제를 관리한다
 */
export class Service extends Effect.Service<Service>()('TaskRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * 새로운 태스크을 생성한다
			 */
			createTask: (payload: TaskInsert): Effect.Effect<string, Supabase.PostgrestError> =>
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
					Effect.map((res) => res.id)
				),

			/**
			 * 태스크을 삭제한다
			 */
			deleteTask: (taskId: string): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('tasks')
						.delete()
						.eq('id', taskId)
						.eq('owner_id', user.id)
						.select()
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound(taskId)),
							onSome: () => Effect.void
						})
					)
				),

			/**
			 * 특정 태스크의 상세 정보를 조회한다
			 */
			getTaskById: (taskId: string): Effect.Effect<Task, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client.from('tasks').select().eq('id', taskId).eq('owner_id', user.id).maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound(taskId)),
							onSome: (task) => Effect.succeed(task)
						})
					)
				),

			/**
			 * 오늘 계획된 태스크 목록을 조회한다
			 */
			getTodayTasks: (): Effect.Effect<Task[], Supabase.PostgrestError> => {
				const today = new Date().toISOString().split('T')[0];
				return Effect.promise(() =>
					client.from('tasks').select().eq('owner_id', user.id).eq('planned_for', today)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 조건에 맞는 태스크 목록을 조회한다
			 */
			getTasks: (
				query: S.Schema.Type<typeof TaskQuerySchema>
			): Effect.Effect<Task[], Supabase.PostgrestError> => {
				let queryBuilder = client.from('tasks').select().eq('owner_id', user.id);

				if (query.title_query) {
					queryBuilder = queryBuilder.ilike('title', `%${query.title_query}%`);
				}

				if (query.project_id) {
					queryBuilder = queryBuilder.eq('project_id', query.project_id);
				}

				if (query.status && HashSet.size(query.status) > 0) {
					const statusArray = Array.from(query.status);
					queryBuilder = queryBuilder.in('status', statusArray);
				}

				if (query.date_start) {
					queryBuilder = queryBuilder.gte(
						'planned_for',
						query.date_start.toISOString().split('T')[0]
					);
				}

				if (query.date_end) {
					queryBuilder = queryBuilder.lte(
						'planned_for',
						query.date_end.toISOString().split('T')[0]
					);
				}

				return Effect.promise(() => queryBuilder).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			},

			/**
			 * 기존 태스크의 정보를 수정한다
			 */
			updateTask: (
				taskId: string,
				payload: TaskUpdate
			): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('tasks')
						.update(payload)
						.eq('id', taskId)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound(taskId)),
							onSome: () => Effect.void
						})
					)
				)
		};
	})
}) {}
