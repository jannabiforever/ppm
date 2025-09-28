import * as S from 'effect/Schema';

/**
 * Schema for a session-task association entity as stored in the database.
 * Represents the many-to-many relationship between focus sessions and tasks.
 * Tracks when tasks are added to sessions for historical and analytical purposes.
 */
export const SessionTaskSchema = S.Struct({
	task_id: S.String,
	session_id: S.String,
	added_at: S.DateTimeUtc
});
