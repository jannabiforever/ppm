import { Schema } from 'effect';

/**
 * Session task schema for managing task associations within a session
 */
export const SessionTaskSchema = Schema.Struct({
	session_id: Schema.String,
	task_id: Schema.String,
	order_index: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	seconds_spent: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))
});

/**
 * Focus session creation schema
 */
export const CreateFocusSessionSchema = Schema.Struct({
	project_id: Schema.optional(Schema.String),
	started_at: Schema.String, // ISO datetime string
	scheduled_end_at: Schema.String, // ISO datetime string (required)
	task_ids: Schema.optional(Schema.Array(Schema.String)) // tasks to associate with session
});

/**
 * Focus session update schema
 */
export const UpdateFocusSessionSchema = Schema.Struct({
	project_id: Schema.optional(Schema.String),
	started_at: Schema.optional(Schema.String),
	scheduled_end_at: Schema.optional(Schema.String),
	closed_at: Schema.optional(Schema.String)
});

/**
 * Start focus session schema
 */
export const StartFocusSessionSchema = Schema.Struct({
	task_ids: Schema.optional(Schema.Array(Schema.String)), // tasks to work on during session
	scheduled_duration_minutes: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())), // defaults to 50 minutes
	project_id: Schema.optional(Schema.String)
});

/**
 * End focus session schema
 */
export const EndFocusSessionSchema = Schema.Struct({
	task_completion_updates: Schema.optional(
		Schema.Array(
			Schema.Struct({
				task_id: Schema.String,
				completed: Schema.Boolean,
				seconds_spent: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))
			})
		)
	)
});

/**
 * Add task to session schema
 */
export const AddTaskToSessionSchema = Schema.Struct({
	session_id: Schema.String,
	task_id: Schema.String,
	order_index: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))
});

/**
 * Remove task from session schema
 */
export const RemoveTaskFromSessionSchema = Schema.Struct({
	session_id: Schema.String,
	task_id: Schema.String
});

/**
 * Update session task schema
 */
export const UpdateSessionTaskSchema = Schema.Struct({
	session_id: Schema.String,
	task_id: Schema.String,
	order_index: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
	seconds_spent: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative()))
});

/**
 * Reorder session tasks schema
 */
export const ReorderSessionTasksSchema = Schema.Struct({
	session_id: Schema.String,
	task_order: Schema.Array(
		Schema.Struct({
			task_id: Schema.String,
			order_index: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
		})
	)
});

/**
 * Focus session query filters schema
 */
export const FocusSessionQuerySchema = Schema.Struct({
	project_id: Schema.optional(Schema.String),
	task_id: Schema.optional(Schema.String), // filter sessions that include this task
	date_from: Schema.optional(Schema.String), // ISO date string
	date_to: Schema.optional(Schema.String), // ISO date string
	include_tasks: Schema.optional(Schema.Boolean), // whether to include associated tasks in response
	is_active: Schema.optional(Schema.Boolean), // filter for active (not closed) sessions
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

/**
 * Session task query filters schema
 */
export const SessionTaskQuerySchema = Schema.Struct({
	session_id: Schema.optional(Schema.String),
	task_id: Schema.optional(Schema.String),
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

// Type exports
export type SessionTask = typeof SessionTaskSchema.Type;
export type CreateFocusSessionInput = typeof CreateFocusSessionSchema.Type;
export type UpdateFocusSessionInput = typeof UpdateFocusSessionSchema.Type;
export type StartFocusSessionInput = typeof StartFocusSessionSchema.Type;
export type EndFocusSessionInput = typeof EndFocusSessionSchema.Type;
export type AddTaskToSessionInput = typeof AddTaskToSessionSchema.Type;
export type RemoveTaskFromSessionInput = typeof RemoveTaskFromSessionSchema.Type;
export type UpdateSessionTaskInput = typeof UpdateSessionTaskSchema.Type;
export type ReorderSessionTasksInput = typeof ReorderSessionTasksSchema.Type;
export type FocusSessionQueryInput = typeof FocusSessionQuerySchema.Type;
export type SessionTaskQueryInput = typeof SessionTaskQuerySchema.Type;
