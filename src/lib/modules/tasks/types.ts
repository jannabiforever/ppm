import * as S from 'effect/Schema';

/**
 * Schema for task status values.
 * - 'backlog': Task is in the backlog, not yet started
 * - 'blocked': Task is blocked by dependencies or external factors
 * - 'completed': Task has been completed
 */
export const TaskStatusSchema = S.Literal('backlog', 'blocked', 'completed');

/**
 * Schema for a complete task entity as stored in the database.
 * Represents a unit of work that can be tracked, scheduled, and completed.
 */
export const TaskSchema = S.Struct({
	completed_in_session_id: S.NullOr(S.String),
	created_at: S.String,
	description: S.NullOr(S.String),
	id: S.String,
	memo: S.NullOr(S.String),
	owner_id: S.String,
	planned_for: S.NullOr(S.DateTimeUtc),
	project_id: S.NullOr(S.String),
	status: TaskStatusSchema,
	title: S.String,
	updated_at: S.DateTimeUtc
});

/**
 * Schema for creating a new task.
 * Most fields are optional as they have default values in the database.
 * The 'title' field is required to identify the task.
 */
export const TaskInsertSchema = S.Struct({
	completed_in_session_id: S.optional(S.NullishOr(S.String)),
	created_at: S.optional(S.String),
	description: S.optional(S.NullishOr(S.String)),
	id: S.optional(S.String),
	memo: S.optional(S.NullishOr(S.String)),
	owner_id: S.String,
	planned_for: S.NullishOr(S.DateTimeUtc),
	project_id: S.NullishOr(S.String),
	status: S.optional(TaskStatusSchema),
	title: S.String,
	updated_at: S.optional(S.String)
});

/**
 * Schema for updating an existing task.
 * All fields are optional to allow partial updates.
 * Only provided fields will be updated in the database.
 */
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

/**
 * Schema for querying tasks with filters.
 * Used to search and filter tasks based on various criteria.
 */
export const TaskQuerySchema = S.Struct({
	date_end: S.optional(S.DateTimeUtc),
	date_start: S.optional(S.DateTimeUtc),
	project_id: S.NullishOr(S.String),
	status: S.optional(S.HashSet(TaskStatusSchema)),
	title_query: S.optional(S.String)
});
