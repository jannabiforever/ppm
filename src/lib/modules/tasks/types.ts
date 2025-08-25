import * as S from 'effect/Schema';

export const TaskStatusSchema = S.Literal('backlog', 'blocked', 'completed');

export const TaskSchema = S.Struct({
	completed_in_session_id: S.NullOr(S.String),
	created_at: S.String,
	description: S.NullOr(S.String),
	id: S.String,
	memo: S.NullOr(S.String),
	owner_id: S.String,
	planned_for: S.NullOr(S.Date),
	project_id: S.NullOr(S.String),
	status: TaskStatusSchema,
	title: S.String,
	updated_at: S.DateTimeUtc
});

export const TaskInsertSchema = S.Struct({
	completed_in_session_id: S.optional(S.NullishOr(S.String)),
	created_at: S.optional(S.String),
	description: S.optional(S.NullishOr(S.String)),
	id: S.optional(S.String),
	memo: S.optional(S.NullishOr(S.String)),
	owner_id: S.String,
	planned_for: S.NullishOr(S.Date),
	project_id: S.NullishOr(S.String),
	status: S.optional(TaskStatusSchema),
	title: S.String,
	updated_at: S.optional(S.String)
});

export const TaskUpdateSchema = S.Struct({
	completed_in_session_id: S.optional(S.NullishOr(S.String)),
	created_at: S.optional(S.String),
	description: S.optional(S.NullishOr(S.String)),
	id: S.optional(S.String),
	memo: S.optional(S.NullishOr(S.String)),
	owner_id: S.optional(S.String),
	planned_for: S.optional(S.NullishOr(S.String)),
	project_id: S.optional(S.NullishOr(S.String)),
	status: S.optional(TaskStatusSchema),
	title: S.optional(S.String),
	updated_at: S.optional(S.DateTimeUtc)
});

export const TaskQuerySchema = S.Struct({
	date_end: S.optional(S.Date),
	date_start: S.optional(S.Date),
	project_id: S.optional(S.String),
	status: S.optional(S.HashSet(TaskStatusSchema)),
	title_query: S.optional(S.String)
});
