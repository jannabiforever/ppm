import { Schema } from 'effect';

/**
 * Focus session creation schema
 */
export const CreateFocusSessionSchema = Schema.Struct({
	task_id: Schema.optional(Schema.String), // null for free focus session
	project_id: Schema.optional(Schema.String), // usually inherited from task
	started_at: Schema.String, // ISO datetime string
	ended_at: Schema.optional(Schema.String), // ISO datetime string
	intensity_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
	progress_note: Schema.optional(Schema.String.pipe(Schema.maxLength(1000)))
});

/**
 * Focus session update schema
 */
export const UpdateFocusSessionSchema = Schema.Struct({
	task_id: Schema.optional(Schema.String),
	project_id: Schema.optional(Schema.String),
	started_at: Schema.optional(Schema.String),
	ended_at: Schema.optional(Schema.String),
	intensity_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
	progress_note: Schema.optional(Schema.String.pipe(Schema.maxLength(1000)))
});

/**
 * Start focus session schema
 */
export const StartFocusSessionSchema = Schema.Struct({
	task_id: Schema.optional(Schema.String)
});

/**
 * End focus session schema
 */
export const EndFocusSessionSchema = Schema.Struct({
	intensity_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
	progress_note: Schema.optional(Schema.String.pipe(Schema.maxLength(1000))),
	completed: Schema.optional(Schema.Boolean) // true to mark task as completed
});

/**
 * Focus session query filters schema
 */
export const FocusSessionQuerySchema = Schema.Struct({
	task_id: Schema.optional(Schema.String),
	project_id: Schema.optional(Schema.String),
	date_from: Schema.optional(Schema.String), // ISO date string
	date_to: Schema.optional(Schema.String), // ISO date string
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

// Type exports
export type CreateFocusSessionInput = typeof CreateFocusSessionSchema.Type;
export type UpdateFocusSessionInput = typeof UpdateFocusSessionSchema.Type;
export type StartFocusSessionInput = typeof StartFocusSessionSchema.Type;
export type EndFocusSessionInput = typeof EndFocusSessionSchema.Type;
export type FocusSessionQueryInput = typeof FocusSessionQuerySchema.Type;
