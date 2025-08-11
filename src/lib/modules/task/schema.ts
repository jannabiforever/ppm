import { Schema } from 'effect';

/**
 * Task status enum schema
 */
export const TaskStatusSchema = Schema.Literal(
	'backlog',
	'planned',
	'in_session',
	'blocked',
	'completed'
);

/**
 * Task creation schema
 */
export const CreateTaskSchema = Schema.Struct({
	title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(1000))),
	project_id: Schema.optional(Schema.String), // null for inbox
	status: Schema.optional(TaskStatusSchema), // defaults to 'backlog'
	planned_for: Schema.optional(Schema.String), // ISO date string
	blocked_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Task update schema
 */
export const UpdateTaskSchema = Schema.Struct({
	title: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200))),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(1000))),
	project_id: Schema.optional(Schema.String), // null to move to inbox
	status: Schema.optional(TaskStatusSchema),
	planned_for: Schema.optional(Schema.String), // ISO date string
	blocked_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Task query filters schema
 */
export const TaskQuerySchema = Schema.Struct({
	project_id: Schema.optional(Schema.String), // null for inbox tasks
	status: Schema.optional(TaskStatusSchema),
	planned_for: Schema.optional(Schema.String), // ISO date string
	search: Schema.optional(Schema.String), // search in title/description
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

/**
 * Move task to project schema
 */
export const MoveTaskToProjectSchema = Schema.Struct({
	task_id: Schema.String,
	project_id: Schema.optional(Schema.String) // null to move to inbox
});

// Type exports
export type TaskStatus = typeof TaskStatusSchema.Type;
export type CreateTaskInput = typeof CreateTaskSchema.Type;
export type UpdateTaskInput = typeof UpdateTaskSchema.Type;
export type TaskQueryInput = typeof TaskQuerySchema.Type;
export type MoveTaskToProjectInput = typeof MoveTaskToProjectSchema.Type;
