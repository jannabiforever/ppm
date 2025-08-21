import type { Database, Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type TaskStatus = Database['public']['Enums']['task_status'];
export const TaskStatusSchema = S.Literal('backlog', 'blocked', 'completed');

export type Task = Tables<'tasks'>;
export const TaskSchema = S.Struct({
	completed_in_session_id: S.Union(S.String, S.Null),
	created_at: S.String,
	description: S.Union(S.String, S.Null),
	id: S.String,
	memo: S.Union(S.String, S.Null),
	owner_id: S.String,
	planned_for: S.Union(S.String, S.Null),
	project_id: S.Union(S.String, S.Null),
	status: TaskStatusSchema,
	title: S.String,
	updated_at: S.String
});

export type TaskInsert = TablesInsert<'tasks'>;
export const TaskInsertSchema = S.Struct({
	completed_in_session_id: S.optional(S.Union(S.String, S.Null)),
	created_at: S.optional(S.String),
	description: S.optional(S.Union(S.String, S.Null)),
	id: S.optional(S.String),
	memo: S.optional(S.Union(S.String, S.Null)),
	owner_id: S.String,
	planned_for: S.optional(S.Union(S.String, S.Null)),
	project_id: S.optional(S.Union(S.String, S.Null)),
	status: S.optional(TaskStatusSchema),
	title: S.String,
	updated_at: S.optional(S.String)
});

export type TaskUpdate = TablesUpdate<'tasks'>;
export const TaskUpdateSchema = S.Struct({
	completed_in_session_id: S.optional(S.Union(S.String, S.Null)),
	created_at: S.optional(S.String),
	description: S.optional(S.Union(S.String, S.Null)),
	id: S.optional(S.String),
	memo: S.optional(S.Union(S.String, S.Null)),
	owner_id: S.optional(S.String),
	planned_for: S.optional(S.Union(S.String, S.Null)),
	project_id: S.optional(S.Union(S.String, S.Null)),
	status: S.optional(TaskStatusSchema),
	title: S.optional(S.String),
	updated_at: S.optional(S.String)
});

export const TaskQuerySchema = S.Struct({
	date_end: S.optional(S.Date),
	date_start: S.optional(S.Date),
	project_id: S.optional(S.String),
	status: S.optional(S.HashSet(TaskStatusSchema)),
	title_query: S.optional(S.String)
});
