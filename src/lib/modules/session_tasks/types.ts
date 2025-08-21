import type { Tables } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type SessionTask = Tables<'session_tasks'>;
export const SessionTaskSchema = S.Struct({
	task_id: S.String,
	session_id: S.String,
	added_at: S.DateTimeUtc
});
