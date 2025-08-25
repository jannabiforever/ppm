import { Effect, Option, DateTime } from 'effect';
import * as Supabase from '../supabase';
import * as S from 'effect/Schema';
import {
	FocusSessionSchema,
	FocusSessionInsertSchema,
	FocusSessionUpdateSchema,
	FocusSessionQuerySchema
} from './types';
import { PaginationQuerySchema } from '$lib/shared/pagination';
import {
	NotFound,
	InvalidProject,
	InvalidOwner,
	HasDependencies,
	TimeConflict,
	InvalidTime
} from './errors';

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
			createFocusSession: (
				payload: typeof FocusSessionInsertSchema.Encoded
			): Effect.Effect<
				string,
				Supabase.PostgrestError | InvalidProject | InvalidOwner | TimeConflict | InvalidTime
			> =>
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
					Effect.map((res) => res.id),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<
							never,
							Supabase.PostgrestError | InvalidProject | InvalidOwner | TimeConflict | InvalidTime
						> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject(payload.project_id || ''));
								}
								if (error.message.includes('owner_id')) {
									return Effect.fail(new InvalidOwner(user.id));
								}
							}
							if (error.code === '23514') {
								// Check constraint violation
								if (error.message.includes('check_end_after_start')) {
									return Effect.fail(new InvalidTime(payload.start_at, payload.end_at));
								}
							}
							if (error.code === 'P0001') {
								// Trigger error - overlapping sessions
								if (error.message.includes('overlapping') || error.message.includes('중복')) {
									return Effect.fail(
										new TimeConflict('existing-session', payload.start_at, payload.end_at)
									);
								}
							}
							return Effect.fail(error);
						}
					)
				),

			/**
			 * 포커스 세션을 삭제한다
			 */
			deleteFocusSession: (
				sessionId: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound | HasDependencies> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.delete()
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound(sessionId)),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(error): Effect.Effect<never, Supabase.PostgrestError | HasDependencies> =>
							error.code === '23503'
								? Effect.fail(new HasDependencies(sessionId))
								: Effect.fail(error)
					)
				),

			/**
			 * 특정 포커스 세션의 상세 정보를 조회한다
			 */
			getFocusSessionById: (
				sessionId: string
			): Effect.Effect<typeof FocusSessionSchema.Type, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: (session) =>
								S.decode(FocusSessionSchema)(session).pipe(
									Effect.mapError(() => new NotFound(sessionId))
								),
							onNone: () => Effect.fail(new NotFound(sessionId))
						})
					)
				),

			/**
			 * 기존 포커스 세션의 정보를 수정한다
			 */
			updateFocusSession: (
				sessionId: string,
				payload: typeof FocusSessionUpdateSchema.Encoded
			): Effect.Effect<
				void,
				Supabase.PostgrestError | NotFound | InvalidProject | TimeConflict | InvalidTime
			> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.update(payload)
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound(sessionId)),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<
							never,
							Supabase.PostgrestError | InvalidProject | TimeConflict | InvalidTime
						> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject(payload.project_id || ''));
								}
							}
							if (error.code === '23514') {
								// Check constraint violation
								if (error.message.includes('check_end_after_start')) {
									return Effect.fail(new InvalidTime(payload.start_at || '', payload.end_at || ''));
								}
							}
							if (error.code === 'P0001') {
								// Trigger error - overlapping sessions
								if (error.message.includes('overlapping') || error.message.includes('중복')) {
									return Effect.fail(
										new TimeConflict(
											'existing-session',
											payload.start_at || '',
											payload.end_at || ''
										)
									);
								}
							}
							return Effect.fail(error);
						}
					)
				),

			/**
			 * 조건에 맞는 포커스 세션 목록을 조회한다
			 */
			getFocusSessions: (
				query?: typeof FocusSessionQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					// Decode query for Date types
					const decodedQuery = query
						? yield* S.decode(FocusSessionQuerySchema)(query).pipe(Effect.orDie)
						: undefined;

					let queryBuilder = client.from('focus_sessions').select().eq('owner_id', user.id);

					if (decodedQuery?.project_id !== undefined) {
						queryBuilder =
							decodedQuery.project_id === null
								? queryBuilder.is('project_id', null)
								: queryBuilder.eq('project_id', decodedQuery.project_id);
					}

					if (decodedQuery?.from_date) {
						queryBuilder = queryBuilder.gte('start_at', DateTime.formatIso(decodedQuery.from_date));
					}

					if (decodedQuery?.to_date) {
						queryBuilder = queryBuilder.lte('start_at', DateTime.formatIso(decodedQuery.to_date));
					}

					if (decodedQuery?.is_active) {
						const now = DateTime.formatIso(DateTime.unsafeNow());
						queryBuilder = queryBuilder.lte('start_at', now).gte('end_at', now);
					}

					queryBuilder = queryBuilder.order('start_at', { ascending: false });

					if (decodedQuery?.limit) {
						queryBuilder = queryBuilder.limit(decodedQuery.limit);
					}

					if (decodedQuery?.offset) {
						queryBuilder = queryBuilder.range(
							decodedQuery.offset,
							decodedQuery.offset + (decodedQuery.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => queryBuilder).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 현재 활성 중인 세션을 조회한다 (start_at <= now <= end_at)
			 */
			getActiveFocusSession: (): Effect.Effect<
				Option.Option<typeof FocusSessionSchema.Type>,
				Supabase.PostgrestError
			> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());
				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.lte('start_at', now)
						.gte('end_at', now)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap((option) =>
						Option.match(option, {
							onNone: () => Effect.succeed(Option.none()),
							onSome: (session) =>
								S.decode(FocusSessionSchema)(session).pipe(Effect.map(Option.some), Effect.orDie)
						})
					)
				);
			},

			/**
			 * 특정 프로젝트의 세션 목록을 조회한다
			 */
			getFocusSessionsOfCertainProject: (
				projectId: string,
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.eq('project_id', projectId)
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 특정 날짜의 세션 목록을 조회한다
			 */
			getFocusSessionsByDate: (
				date: Date
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const startOfDay = new Date(date);
					startOfDay.setHours(0, 0, 0, 0);
					const endOfDay = new Date(date);
					endOfDay.setHours(23, 59, 59, 999);

					const response = yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.select()
							.eq('owner_id', user.id)
							.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startOfDay)))
							.lt('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endOfDay)))
							.order('start_at', { ascending: true })
					).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 기간별 세션 목록을 조회한다
			 */
			getFocusSessionsInRange: (
				startDate: Date,
				endDate: Date,
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startDate)))
						.lte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endDate)))
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 예정된 세션 목록을 조회한다 (아직 시작하지 않은 세션)
			 */
			getUpcomingFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					const now = DateTime.formatIso(DateTime.unsafeNow());
					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.gt('start_at', now)
						.order('start_at', { ascending: true });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 완료된 세션 목록을 조회한다
			 */
			getCompletedFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.lt('end_at', DateTime.formatIso(DateTime.unsafeNow()))
						.order('end_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 수집함의 세션 목록을 조회한다
			 */
			getInboxFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.is('project_id', null)
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * 세션이 현재 활성 상태인지 확인한다.
			 */
			isFocusSessionActive: (
				sessionId: string
			): Effect.Effect<boolean, Supabase.PostgrestError | NotFound> => {
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
						Option.match(session, {
							onSome: (session) => Effect.succeed(session.start_at <= now && session.end_at >= now),
							onNone: () => Effect.fail(new NotFound(sessionId))
						})
					)
				);
			}
		};
	})
}) {}
