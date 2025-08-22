import * as S from 'effect/Schema';

// 세션 시작 가능 여부 확인 시 사용하는 파라미터
export const CanStartSessionAtParams = S.Struct({
	start_at: S.DateTimeUtc,
	duration_minutes: S.Number
});
export type CanStartSessionAtParams = S.Schema.Type<typeof CanStartSessionAtParams>;

// 세션 생성 시 충돌 검사를 포함한 파라미터
export const CreateSessionWithConflictCheckParams = S.Struct({
	project_id: S.NullOr(S.String),
	start_at: S.DateTimeUtc,
	end_at: S.DateTimeUtc
});
export type CreateSessionWithConflictCheckParams = S.Schema.Type<typeof CreateSessionWithConflictCheckParams>;

// 세션 시간 변경 시 충돌 검사를 포함한 파라미터
export const UpdateSessionTimeWithConflictCheckParams = S.Struct({
	session_id: S.String,
	start_at: S.optional(S.DateTimeUtc),
	end_at: S.optional(S.DateTimeUtc)
});
export type UpdateSessionTimeWithConflictCheckParams = S.Schema.Type<typeof UpdateSessionTimeWithConflictCheckParams>;

// 시간 충돌 검사 결과
export const TimeConflictCheckResult = S.Struct({
	has_conflict: S.Boolean,
	conflicting_sessions: S.optional(S.Array(S.Struct({
		id: S.String,
		start_at: S.DateTimeUtc,
		end_at: S.DateTimeUtc,
		project_id: S.NullOr(S.String)
	})))
});
export type TimeConflictCheckResult = S.Schema.Type<typeof TimeConflictCheckResult>;

// 사용 가능한 시간 슬롯 조회 파라미터
export const FindAvailableTimeSlotsParams = S.Struct({
	date: S.DateTimeUtc,
	duration_minutes: S.Number,
	from_time: S.optional(S.DateTimeUtc),
	to_time: S.optional(S.DateTimeUtc)
});
export type FindAvailableTimeSlotsParams = S.Schema.Type<typeof FindAvailableTimeSlotsParams>;

// 사용 가능한 시간 슬롯
export const AvailableTimeSlot = S.Struct({
	start_at: S.DateTimeUtc,
	end_at: S.DateTimeUtc
});
export type AvailableTimeSlot = S.Schema.Type<typeof AvailableTimeSlot>;
