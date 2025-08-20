import type { Database, Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

export type TaskStatus = Database['public']['Enums']['task_status'];
export const TaskStatusSchema = S.Literal(
	'backlog',
	'planned',
	'in_session',
	'blocked',
	'completed'
);

export const TaskQuerySchema = S.Struct({
	date_end: S.optional(S.Date),
	date_start: S.optional(S.Date),
	project_id: S.optional(S.String),
	status: S.optional(S.HashSet(TaskStatusSchema)),
	title_query: S.optional(S.String)
});
