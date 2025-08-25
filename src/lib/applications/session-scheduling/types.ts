import * as S from 'effect/Schema';

// 세션 시작 가능 여부 확인 시 사용하는 파라미터
export const CanStartSessionAtParamsSchema = S.Struct({
	start_at: S.DateTimeUtc,
	duration_minutes: S.Number
});

// 세션 생성 시 충돌 검사를 포함한 파라미터
export const CreateSessionWithConflictCheckParamsSchema = S.Struct({
	project_id: S.NullOr(S.String),
	start_at: S.DateTimeUtc,
	end_at: S.DateTimeUtc
});

// 세션 시간 변경 시 충돌 검사를 포함한 파라미터
export const UpdateSessionTimeWithConflictCheckParamsSchema = S.Struct({
	session_id: S.String,
	start_at: S.optional(S.DateTimeUtc),
	end_at: S.optional(S.DateTimeUtc)
});

// 시간 충돌 검사 결과
export const TimeConflictCheckResultSchema = S.Struct({
	has_conflict: S.Boolean,
	conflicting_sessions: S.optional(
		S.Array(
			S.Struct({
				id: S.String,
				start_at: S.DateTimeUtc,
				end_at: S.DateTimeUtc,
				project_id: S.NullOr(S.String)
			})
		)
	)
});

// 사용 가능한 시간 슬롯 조회 파라미터
export const FindAvailableTimeSlotsParamsSchema = S.Struct({
	date: S.DateTimeUtc,
	duration_minutes: S.Number,
	from_time: S.optional(S.DateTimeUtc),
	to_time: S.optional(S.DateTimeUtc)
});

// 사용 가능한 시간 슬롯
export const AvailableTimeSlotSchema = S.Struct({
	start_at: S.DateTimeUtc,
	end_at: S.DateTimeUtc
});
