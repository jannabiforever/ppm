import { DateTime, Effect, Option } from 'effect';
import * as S from 'effect/Schema';
import * as Supabase from '../supabase';
import { PaginationQuerySchema } from '$lib/shared/pagination';
import { TaskAlreadyInSessionError, TaskNotInSessionError } from './errors';

export class Service extends Effect.Service<Service>()('SessionTaskRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		// 1. 세션-태스크 연결 관리

		// 세션에 태스크 추가
		const addTaskToSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				// 이미 추가되어 있는지 확인
				const existing = yield* getSessionTask(params);
				if (Option.isSome(existing)) {
					return yield* Effect.fail(
						new TaskAlreadyInSessionError({
							task_id: params.task_id,
							session_id: params.session_id
						})
					);
				}

				// 추가
				const data = {
					session_id: params.session_id,
					task_id: params.task_id
				};

				return yield* Effect.promise(() => client.from('session_tasks').insert(data).select()).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.asVoid
				);
			});

		// 세션에서 태스크 제거
		const removeTaskFromSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				// 존재하는지 확인
				const existing = yield* getSessionTask(params);
				if (Option.isNone(existing)) {
					return yield* Effect.fail(
						new TaskNotInSessionError({
							task_id: params.task_id,
							session_id: params.session_id
						})
					);
				}

				// 제거
				return yield* Effect.promise(() =>
					client
						.from('session_tasks')
						.delete()
						.eq('session_id', params.session_id)
						.eq('task_id', params.task_id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse), Effect.asVoid);
			});

		// 여러 태스크를 한번에 추가
		const addTasksToSession = (params: { session_id: string; task_ids: readonly string[] }) =>
			Effect.gen(function* () {
				// 이미 추가된 태스크들 확인
				const existingTasks = yield* getTasksBySession(params.session_id);
				const existingTaskIds = new Set(existingTasks.map((st) => st.task_id));

				// 새로 추가할 태스크들만 필터링
				const newTaskIds = params.task_ids.filter((id) => !existingTaskIds.has(id));

				if (newTaskIds.length === 0) {
					return;
				}

				// 벌크 추가
				const data = newTaskIds.map((task_id) => ({
					session_id: params.session_id,
					task_id
				}));

				return yield* Effect.promise(() => client.from('session_tasks').insert(data)).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.asVoid
				);
			});

		// 세션의 모든 태스크 연결 제거
		const clearSessionTasks = (session_id: string) =>
			Effect.promise(() => client.from('session_tasks').delete().eq('session_id', session_id)).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.asVoid
			);

		// 2. 조회 기능

		// 세션의 태스크 목록 조회
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
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			});

		// 태스크가 속한 세션 목록 조회
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
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			});

		// 특정 세션-태스크 연결 조회
		const getSessionTask = (params: { session_id: string; task_id: string }) =>
			Effect.promise(() =>
				client
					.from('session_tasks')
					.select('*')
					.eq('session_id', params.session_id)
					.eq('task_id', params.task_id)
					.limit(1)
					.maybeSingle()
			).pipe(Effect.flatMap(Supabase.mapPostgrestResponseOptional));

		// 현재 활성 세션의 태스크 목록
		const getActiveSessionTasks = () =>
			Effect.gen(function* () {
				// 현재 활성 세션 찾기
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

		// 특정 기간 동안의 세션-태스크 연결 조회
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
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			});

		// 3. 검증 및 비즈니스 로직

		// 태스크가 현재 세션에 있는지 확인
		const isTaskInSession = (params: { session_id: string; task_id: string }) =>
			Effect.gen(function* () {
				const result = yield* getSessionTask(params);
				return Option.isSome(result);
			});

		// 태스크가 다른 활성 세션에 있는지 확인
		const isTaskInActiveSession = (task_id: string) =>
			Effect.gen(function* () {
				// 현재 활성 세션 찾기
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

		// 세션의 태스크 개수 조회
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
			// 세션-태스크 연결 관리
			addTaskToSession,
			removeTaskFromSession,
			addTasksToSession,
			clearSessionTasks,

			// 조회 기능
			getTasksBySession,
			getSessionsByTask,
			getSessionTask,
			getActiveSessionTasks,
			getSessionTasksInRange,

			// 검증 및 비즈니스 로직
			isTaskInSession,
			isTaskInActiveSession,
			getSessionTaskCount
		};
	})
}) {}
