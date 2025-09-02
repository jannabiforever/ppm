import * as S from 'effect/Schema';

export const SessionTaskSchema = S.Struct({
	task_id: S.String,
	session_id: S.String,
	added_at: S.DateTimeUtc
});
