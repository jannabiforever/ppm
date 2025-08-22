import { Effect, Option, DateTime } from 'effect';
import * as Supabase from '../supabase';
import * as S from 'effect/Schema';
import type {
	FocusSession,
	FocusSessionInsert,
	FocusSessionUpdate,
	FocusSessionQuerySchema
} from './types';
import { PaginationQuerySchema } from '../pagination';

/**
 * 포커스 세션 관리 서비스
 *
 * @example
 * ```typescript
 * // 세션 생성
 * const sessionId = yield* focusSessionService.createSession({
 *   project_id: "project-123",
 *   start_at: new Date().toISOString(),
 *   end_at: new Date(Date.now() + 50 * 60 * 1000).toISOString()
 * });
 *
 * // 세션 조회
 * const session = yield* focusSessionService.getSessionById(sessionId);
 *
 * // 세션 수정
 * yield* focusSessionService.updateSession(sessionId, {
 *   end_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
 * });
 *
 * // 세션 삭제
 * yield* focusSessionService.deleteSession(sessionId);
 * ```
 */
export class Service extends Effect.Service<Service>()('FocusSessionService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * 새로운 포커스 세션을 생성한다
			 */
			createSession: (
				payload: FocusSessionInsert
			): Effect.Effect<string, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
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
			 * 포커스 세션을 삭제한다
			 */
			deleteSession: (id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('focus_sessions').delete().eq('id', id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 특정 포커스 세션의 상세 정보를 조회한다
			 */
			getSessionById: (
				id: string
			): Effect.Effect<Option.Option<FocusSession>, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('focus_sessions').select().eq('id', id).eq('owner_id', user.id).maybeSingle()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseOptional)),

			/**
			 * 기존 포커스 세션의 정보를 수정한다
			 */
			updateSession: (
				id: string,
				payload: FocusSessionUpdate
			): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('focus_sessions').update(payload).eq('id', id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 조건에 맞는 포커스 세션 목록을 조회한다
			 */
			getSessions: (
				query?: S.Schema.Type<typeof FocusSessionQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				let queryBuilder = client.from('focus_sessions').select().eq('owner_id', user.id);

				if (query?.project_id !== undefined) {
					queryBuilder =
						query.project_id === null
							? queryBuilder.is('project_id', null)
							: queryBuilder.eq('project_id', query.project_id);
				}

				if (query?.from_date) {
					queryBuilder = queryBuilder.gte('start_at', DateTime.formatIso(query.from_date));
				}

				if (query?.to_date) {
					queryBuilder = queryBuilder.lte('start_at', DateTime.formatIso(query.to_date));
				}

				if (query?.is_active) {
					const now = DateTime.formatIso(DateTime.unsafeNow());
					queryBuilder = queryBuilder.lte('start_at', now).gte('end_at', now);
				}

				queryBuilder = queryBuilder.order('start_at', { ascending: false });

				if (query?.limit) {
					queryBuilder = queryBuilder.limit(query.limit);
				}

				if (query?.offset) {
					queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 20) - 1);
				}

				return Effect.promise(() => queryBuilder).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			},

			/**
			 * 현재 활성 중인 세션을 조회한다 (start_at <= now <= end_at)
			 */
			getActiveSession: (): Effect.Effect<Option.Option<FocusSession>, Supabase.PostgrestError> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());
				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.lte('start_at', now)
						.gte('end_at', now)
						.maybeSingle()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseOptional));
			},

			/**
			 * 특정 프로젝트의 세션 목록을 조회한다
			 */
			getProjectSessions: (
				projectId: string,
				pagination?: S.Schema.Type<typeof PaginationQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				let query = client
					.from('focus_sessions')
					.select()
					.eq('owner_id', user.id)
					.eq('project_id', projectId)
					.order('start_at', { ascending: false });

				if (pagination?.limit) {
					query = query.limit(pagination.limit);
				}
				if (pagination?.offset) {
					query = query.range(pagination.offset, pagination.offset + (pagination.limit || 20) - 1);
				}

				return Effect.promise(() => query).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 특정 날짜의 세션 목록을 조회한다
			 */
			getSessionsByDate: (date: Date): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				const startOfDay = new Date(date);
				startOfDay.setHours(0, 0, 0, 0);
				const endOfDay = new Date(date);
				endOfDay.setHours(23, 59, 59, 999);

				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startOfDay)))
						.lt('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endOfDay)))
						.order('start_at', { ascending: true })
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 기간별 세션 목록을 조회한다
			 */
			getSessionsInRange: (
				startDate: Date,
				endDate: Date,
				pagination?: S.Schema.Type<typeof PaginationQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				let query = client
					.from('focus_sessions')
					.select()
					.eq('owner_id', user.id)
					.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startDate)))
					.lte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endDate)))
					.order('start_at', { ascending: false });

				if (pagination?.limit) {
					query = query.limit(pagination.limit);
				}
				if (pagination?.offset) {
					query = query.range(pagination.offset, pagination.offset + (pagination.limit || 20) - 1);
				}

				return Effect.promise(() => query).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 예정된 세션 목록을 조회한다 (아직 시작하지 않은 세션)
			 */
			getUpcomingSessions: (
				pagination?: S.Schema.Type<typeof PaginationQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());
				let query = client
					.from('focus_sessions')
					.select()
					.eq('owner_id', user.id)
					.gt('start_at', now)
					.order('start_at', { ascending: true });

				if (pagination?.limit) {
					query = query.limit(pagination.limit);
				}
				if (pagination?.offset) {
					query = query.range(pagination.offset, pagination.offset + (pagination.limit || 20) - 1);
				}

				return Effect.promise(() => query).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 완료된 세션 목록을 조회한다
			 */
			getCompletedSessions: (
				pagination?: S.Schema.Type<typeof PaginationQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				let query = client
					.from('focus_sessions')
					.select()
					.eq('owner_id', user.id)
					.lt('end_at', DateTime.formatIso(DateTime.unsafeNow()))
					.order('end_at', { ascending: false });

				if (pagination?.limit) {
					query = query.limit(pagination.limit);
				}
				if (pagination?.offset) {
					query = query.range(pagination.offset, pagination.offset + (pagination.limit || 20) - 1);
				}

				return Effect.promise(() => query).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 프로젝트가 없는 세션 목록을 조회한다
			 */
			getSessionsWithoutProject: (
				pagination?: S.Schema.Type<typeof PaginationQuerySchema>
			): Effect.Effect<FocusSession[], Supabase.PostgrestError> => {
				let query = client
					.from('focus_sessions')
					.select()
					.eq('owner_id', user.id)
					.is('project_id', null)
					.order('start_at', { ascending: false });

				if (pagination?.limit) {
					query = query.limit(pagination.limit);
				}
				if (pagination?.offset) {
					query = query.range(pagination.offset, pagination.offset + (pagination.limit || 20) - 1);
				}

				return Effect.promise(() => query).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));
			},

			/**
			 * 특정 시간에 세션을 시작할 수 있는지 확인한다 (시간 충돌 검사)
			 */
			canStartSessionAt: (
				startAt: Date,
				durationMinutes: number
			): Effect.Effect<boolean, Supabase.PostgrestError> => {
				const endAt = new Date(startAt.getTime() + durationMinutes * 60 * 1000);

				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select('id')
						.eq('owner_id', user.id)
						.or(
							`and(start_at.lte.${DateTime.formatIso(DateTime.unsafeFromDate(endAt))},end_at.gt.${DateTime.formatIso(DateTime.unsafeFromDate(startAt))})`
						)
						.limit(1)
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.map((sessions) => sessions.length === 0)
				);
			},

			/**
			 * 세션이 현재 활성 상태인지 확인한다.
			 * 만약 주어진 아이디의 세션이 존재하지 않을 경우 Option.none 반환.
			 */
			isSessionActive: (
				sessionId: string
			): Effect.Effect<Option.Option<boolean>, Supabase.PostgrestError> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());

				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select('id,start_at,end_at')
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap((session) =>
						Effect.succeed(
							Option.match(session, {
								onSome: (session) => Option.some(session.start_at <= now && session.end_at >= now),
								onNone: () => Option.none()
							})
						)
					)
				);
			}
		};
	})
}) {}
