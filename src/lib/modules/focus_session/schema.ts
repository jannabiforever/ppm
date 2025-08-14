import { Schema } from 'effect';
import { DateTimeUtcSchema, OptionalDateTimeUtcSchema } from '$lib/shared/schema';

/**
 * Session task schema for managing task associations within a session
 */
export const SessionTaskSchema = Schema.Struct({
	session_id: Schema.String.pipe(Schema.minLength(1)),
	task_id: Schema.String.pipe(Schema.minLength(1)),
	added_at: DateTimeUtcSchema
});

/**
 * Focus session creation schema
 */
export const CreateFocusSessionSchema = Schema.Struct({
	project_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	started_at: DateTimeUtcSchema,
	scheduled_end_at: DateTimeUtcSchema,
	task_ids: Schema.optional(Schema.Array(Schema.String.pipe(Schema.minLength(1)))) // tasks to associate with session
});

/**
 * Focus session update schema
 */
export const UpdateFocusSessionSchema = Schema.Struct({
	project_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	started_at: OptionalDateTimeUtcSchema,
	scheduled_end_at: OptionalDateTimeUtcSchema,
	closed_at: OptionalDateTimeUtcSchema
});

/**
 * Start focus session schema
 */
export const StartFocusSessionSchema = Schema.Struct({
	task_ids: Schema.optional(Schema.Array(Schema.String.pipe(Schema.minLength(1)))), // tasks to work on during session
	scheduled_duration_minutes: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())), // defaults to 50 minutes
	project_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	started_at: Schema.optional(DateTimeUtcSchema) // Allow manual start time override
});

/**
 * End focus session schema
 */
export const EndFocusSessionSchema = Schema.Struct({
	task_completion_updates: Schema.optional(
		Schema.Array(
			Schema.Struct({
				task_id: Schema.String.pipe(Schema.minLength(1)),
				completed: Schema.Boolean
			})
		)
	)
});

/**
 * Add task to session schema
 */
export const AddTaskToSessionSchema = Schema.Struct({
	session_id: Schema.String.pipe(Schema.minLength(1)),
	task_id: Schema.String.pipe(Schema.minLength(1))
});

/**
 * Remove task from session schema
 */
export const RemoveTaskFromSessionSchema = Schema.Struct({
	session_id: Schema.String.pipe(Schema.minLength(1)),
	task_id: Schema.String.pipe(Schema.minLength(1))
});

/**
 * Focus session query filters schema
 */
export const FocusSessionQuerySchema = Schema.Struct({
	project_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	task_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))), // filter sessions that include this task
	date_from: Schema.optional(DateTimeUtcSchema), // DateTime for precise filtering
	date_to: Schema.optional(DateTimeUtcSchema), // DateTime for precise filtering
	include_tasks: Schema.optional(Schema.Boolean), // whether to include associated tasks in response
	is_active: Schema.optional(Schema.Boolean), // filter for active (not closed) sessions
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

/**
 * Session task query filters schema
 */
export const SessionTaskQuerySchema = Schema.Struct({
	session_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
	task_id: Schema.optional(Schema.String.pipe(Schema.minLength(1))),
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

export type FocusSessionQueryInput = typeof FocusSessionQuerySchema.Type;
export type SessionTaskQueryInput = typeof SessionTaskQuerySchema.Type;
