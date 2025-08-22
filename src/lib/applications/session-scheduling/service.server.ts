import { Effect, Option, DateTime } from 'effect';
import * as FocusSessions from '$lib/modules/focus_sessions';
import { TimeConflictError, InvalidSessionTimeError, NoAvailableTimeSlotError } from './errors';
import type {
	CanStartSessionAtParams,
	CreateSessionWithConflictCheckParams,
	UpdateSessionTimeWithConflictCheckParams,
	TimeConflictCheckResult,
	FindAvailableTimeSlotsParams,
	AvailableTimeSlot
} from './types';

/**
 * 세션 스케줄링 애플리케이션 서비스
 *
 * 세션 시간 충돌 검사, 사용 가능한 시간 찾기 등의 스케줄링 관련 비즈니스 로직을 처리한다
 */
export class Service extends Effect.Service<Service>()('SessionScheduling', {
	effect: Effect.gen(function* () {
		const focusSessionsService = yield* FocusSessions.Service;

		/**
		 * 특정 시간에 세션을 시작할 수 있는지 확인한다
		 */
		const canStartSessionAt = (params: CanStartSessionAtParams): Effect.Effect<boolean, Error> =>
			Effect.gen(function* () {
				const startMillis = DateTime.toEpochMillis(params.start_at);
				const endMillis = startMillis + params.duration_minutes * 60 * 1000;
				const endAt = DateTime.unsafeMake(endMillis);

				// 시간 유효성 검사
				if (endMillis <= startMillis) {
					return false;
				}

				// 해당 시간대에 충돌하는 세션들 조회
				const sessions = yield* focusSessionsService.getSessions({
					from_date: params.start_at,
					to_date: endAt,
					limit: 100,
					offset: 0
				});

				// 충돌 검사
				for (const session of sessions) {
					const sessionStart = DateTime.unsafeMake(session.start_at);
					const sessionEnd = DateTime.unsafeMake(session.end_at);

					// 시간이 겹치는지 확인
					if (
						DateTime.between(params.start_at, { minimum: sessionStart, maximum: sessionEnd }) ||
						DateTime.between(endAt, { minimum: sessionStart, maximum: sessionEnd }) ||
						(DateTime.lessThanOrEqualTo(params.start_at, sessionStart) &&
							DateTime.greaterThanOrEqualTo(endAt, sessionEnd))
					) {
						return false;
					}
				}

				return true;
			});

		/**
		 * 시간 충돌을 검사하고 상세 정보를 반환한다
		 */
		const checkTimeConflict = (
			start_at: DateTime.Utc,
			end_at: DateTime.Utc,
			exclude_session_id?: string
		): Effect.Effect<TimeConflictCheckResult, Error> =>
			Effect.gen(function* () {
				// 시간 유효성 검사
				if (DateTime.lessThanOrEqualTo(end_at, start_at)) {
					return yield* Effect.fail(
						new InvalidSessionTimeError({
							start_at: DateTime.formatIso(start_at),
							end_at: DateTime.formatIso(end_at)
						})
					);
				}

				// 해당 시간대에 충돌하는 세션들 조회
				const sessions = yield* focusSessionsService.getSessions({
					from_date: start_at,
					to_date: end_at,
					limit: 100,
					offset: 0
				});

				const conflictingSessions = sessions.filter((session) => {
					// 제외할 세션은 건너뛰기
					if (exclude_session_id && session.id === exclude_session_id) {
						return false;
					}

					const sessionStart = DateTime.unsafeMake(session.start_at);
					const sessionEnd = DateTime.unsafeMake(session.end_at);

					// 시간이 겹치는지 확인
					return (
						DateTime.between(start_at, { minimum: sessionStart, maximum: sessionEnd }) ||
						DateTime.between(end_at, { minimum: sessionStart, maximum: sessionEnd }) ||
						(DateTime.lessThanOrEqualTo(start_at, sessionStart) &&
							DateTime.greaterThanOrEqualTo(end_at, sessionEnd))
					);
				});

				return {
					has_conflict: conflictingSessions.length > 0,
					conflicting_sessions: conflictingSessions.map((s) => ({
						id: s.id,
						start_at: DateTime.unsafeMake(s.start_at),
						end_at: DateTime.unsafeMake(s.end_at),
						project_id: s.project_id
					}))
				};
			});

		/**
		 * 충돌 검사를 포함하여 세션을 생성한다
		 */
		const createSessionWithConflictCheck = (
			params: CreateSessionWithConflictCheckParams
		): Effect.Effect<string, TimeConflictError | InvalidSessionTimeError | Error> =>
			Effect.gen(function* () {
				// 충돌 검사
				const conflictResult = yield* checkTimeConflict(params.start_at, params.end_at);

				if (conflictResult.has_conflict) {
					return yield* Effect.fail(
						new TimeConflictError({
							start_at: DateTime.formatIso(params.start_at),
							end_at: DateTime.formatIso(params.end_at),
							conflicting_session_ids: conflictResult.conflicting_sessions!.map((s) => s.id)
						})
					);
				}

				// 세션 생성
				return yield* focusSessionsService.createSession({
					project_id: params.project_id,
					start_at: DateTime.formatIso(params.start_at),
					end_at: DateTime.formatIso(params.end_at)
				});
			});

		/**
		 * 충돌 검사를 포함하여 세션 시간을 수정한다
		 */
		const updateSessionTimeWithConflictCheck = (
			params: UpdateSessionTimeWithConflictCheckParams
		): Effect.Effect<void, TimeConflictError | InvalidSessionTimeError | Error> =>
			Effect.gen(function* () {
				// 현재 세션 정보 조회
				const currentSession = yield* focusSessionsService.getSessionById(params.session_id);
				if (Option.isNone(currentSession)) {
					return yield* Effect.fail(new Error(`세션을 찾을 수 없습니다: ${params.session_id}`));
				}

				const session = currentSession.value;
				const newStartAt = params.start_at || DateTime.unsafeMake(session.start_at);
				const newEndAt = params.end_at || DateTime.unsafeMake(session.end_at);

				// 충돌 검사 (자기 자신은 제외)
				const conflictResult = yield* checkTimeConflict(newStartAt, newEndAt, params.session_id);

				if (conflictResult.has_conflict) {
					return yield* Effect.fail(
						new TimeConflictError({
							start_at: DateTime.formatIso(newStartAt),
							end_at: DateTime.formatIso(newEndAt),
							conflicting_session_ids: conflictResult.conflicting_sessions!.map((s) => s.id)
						})
					);
				}

				// 세션 시간 업데이트
				const updatePayload: FocusSessions.FocusSessionUpdate = {};
				if (params.start_at) updatePayload.start_at = DateTime.formatIso(params.start_at);
				if (params.end_at) updatePayload.end_at = DateTime.formatIso(params.end_at);

				yield* focusSessionsService.updateSession(params.session_id, updatePayload);
			});

		/**
		 * 특정 날짜에 사용 가능한 시간 슬롯을 찾는다
		 */
		const findAvailableTimeSlots = (
			params: FindAvailableTimeSlotsParams
		): Effect.Effect<AvailableTimeSlot[], NoAvailableTimeSlotError | Error> =>
			Effect.gen(function* () {
				// 검색 범위 설정
				const dateMillis = DateTime.toEpochMillis(params.date);
				const dateObj = new Date(dateMillis);

				// 날짜의 시작과 끝 시간 생성
				const startOfDayMillis = new Date(
					dateObj.getFullYear(),
					dateObj.getMonth(),
					dateObj.getDate(),
					0,
					0,
					0,
					0
				).getTime();
				const endOfDayMillis = new Date(
					dateObj.getFullYear(),
					dateObj.getMonth(),
					dateObj.getDate(),
					23,
					59,
					59,
					999
				).getTime();

				const startOfDay = DateTime.unsafeMake(startOfDayMillis);
				const endOfDay = DateTime.unsafeMake(endOfDayMillis);

				const fromTime = params.from_time || startOfDay;
				const toTime = params.to_time || endOfDay;

				// 해당 날짜의 모든 세션 조회
				const sessions = yield* focusSessionsService.getSessionsByDate(
					DateTime.toDate(params.date)
				);

				// 세션들을 시작 시간 기준으로 정렬
				const sortedSessions = [...sessions].sort((a, b) => {
					const aStart = DateTime.toEpochMillis(DateTime.unsafeMake(a.start_at));
					const bStart = DateTime.toEpochMillis(DateTime.unsafeMake(b.start_at));
					return aStart - bStart;
				});

				const availableSlots: AvailableTimeSlot[] = [];
				let currentTime = fromTime;

				// 세션들 사이의 빈 시간 찾기
				for (const session of sortedSessions) {
					const sessionStart = DateTime.unsafeMake(session.start_at);
					const sessionEnd = DateTime.unsafeMake(session.end_at);

					// 현재 시간과 세션 시작 시간 사이에 충분한 공간이 있는지 확인
					const gapMillis =
						DateTime.toEpochMillis(sessionStart) - DateTime.toEpochMillis(currentTime);
					if (gapMillis >= params.duration_minutes * 60 * 1000) {
						const slotEndMillis =
							DateTime.toEpochMillis(currentTime) + params.duration_minutes * 60 * 1000;
						const slotEnd = DateTime.unsafeMake(slotEndMillis);
						availableSlots.push({
							start_at: currentTime,
							end_at: slotEnd
						});
					}

					// 현재 시간을 세션 종료 시간으로 업데이트
					if (DateTime.greaterThan(sessionEnd, currentTime)) {
						currentTime = sessionEnd;
					}
				}

				// 마지막 세션 이후부터 검색 종료 시간까지 확인
				const finalGapMillis = DateTime.toEpochMillis(toTime) - DateTime.toEpochMillis(currentTime);
				if (finalGapMillis >= params.duration_minutes * 60 * 1000) {
					const slotEndMillis =
						DateTime.toEpochMillis(currentTime) + params.duration_minutes * 60 * 1000;
					const slotEnd = DateTime.unsafeMake(slotEndMillis);
					availableSlots.push({
						start_at: currentTime,
						end_at: slotEnd
					});
				}

				if (availableSlots.length === 0) {
					return yield* Effect.fail(
						new NoAvailableTimeSlotError({
							date: DateTime.formatIso(params.date),
							duration_minutes: params.duration_minutes
						})
					);
				}

				return availableSlots;
			});

		/**
		 * 다음 사용 가능한 시간 슬롯을 찾는다
		 */
		const findNextAvailableSlot = (
			duration_minutes: number,
			from_time?: DateTime.Utc
		): Effect.Effect<AvailableTimeSlot, NoAvailableTimeSlotError | Error> =>
			Effect.gen(function* () {
				const startTime = from_time || DateTime.unsafeNow();
				let currentDateMillis = DateTime.toEpochMillis(startTime);

				// 최대 30일까지 검색
				for (let i = 0; i < 30; i++) {
					const currentDate = DateTime.unsafeMake(currentDateMillis);

					const slots = yield* Effect.orElse(
						findAvailableTimeSlots({
							date: currentDate,
							duration_minutes,
							from_time: i === 0 ? startTime : undefined
						}),
						() => Effect.succeed([])
					);

					if (slots.length > 0) {
						return slots[0];
					}

					// 다음 날로 이동
					currentDateMillis += 24 * 60 * 60 * 1000;
				}

				return yield* Effect.fail(
					new NoAvailableTimeSlotError({
						date: DateTime.formatIso(startTime),
						duration_minutes
					})
				);
			});

		return {
			canStartSessionAt,
			checkTimeConflict,
			createSessionWithConflictCheck,
			updateSessionTimeWithConflictCheck,
			findAvailableTimeSlots,
			findNextAvailableSlot
		};
	})
}) {}
