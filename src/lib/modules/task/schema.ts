import { Schema } from 'effect';
import { OptionalDateSchema } from '$lib/shared/schema';

/**
 * Task status enum schema defining the workflow states of a task.
 *
 * Represents the lifecycle of a task from creation to completion:
 * - backlog: Initial state, task is created but not yet planned
 * - planned: Task is scheduled and ready to be worked on
 * - in_session: Task is currently being worked on in a focus session
 * - blocked: Task cannot proceed due to external dependencies or issues
 * - completed: Task has been finished successfully
 *
 * Status transitions are validated by business rules to ensure workflow integrity.
 */
export const TaskStatusSchema = Schema.Literal(
	'backlog',
	'planned',
	'in_session',
	'blocked',
	'completed'
);

/**
 * Task creation schema for validating new task input.
 *
 * Defines the structure and validation rules for creating new tasks.
 * Tasks can be created in projects or in the inbox (unassigned).
 */
export const CreateTaskSchema = Schema.Struct({
	/**
	 * The task title (required).
	 * Must be between 1-200 characters for readability and database constraints.
	 */
	title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),

	/**
	 * Optional detailed description of the task.
	 * Limited to 1000 characters to prevent excessive content.
	 */
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(1000))),

	/**
	 * Optional project assignment.
	 * Use null or undefined to create task in inbox (unassigned).
	 * Must be a valid project ID that the user has access to.
	 */
	project_id: Schema.optional(Schema.String),

	/**
	 * Initial task status.
	 * Defaults to 'backlog' if not specified.
	 */
	status: Schema.optional(TaskStatusSchema),

	/**
	 * Optional planned execution date.
	 * Uses DateSchema for type-safe date handling in YYYY-MM-DD format.
	 */
	planned_for: OptionalDateSchema,

	/**
	 * Optional note explaining why the task is blocked.
	 * Only relevant when status is 'blocked'. Limited to 500 characters.
	 */
	blocked_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Task update schema for validating partial task updates.
 *
 * All fields are optional since this is used for partial updates.
 * Only provided fields will be updated, others remain unchanged.
 */
export const UpdateTaskSchema = Schema.Struct({
	/**
	 * Optional new title for the task.
	 * Must be between 1-200 characters if provided.
	 */
	title: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200))),

	/**
	 * Optional new description for the task.
	 * Limited to 1000 characters to prevent excessive content.
	 */
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(1000))),

	/**
	 * Optional project reassignment.
	 * Use null to move task to inbox (unassigned state).
	 * Use project ID to assign to specific project.
	 */
	project_id: Schema.optional(Schema.String),

	/**
	 * Optional status update.
	 * Status transitions are validated by business rules in the service layer.
	 */
	status: Schema.optional(TaskStatusSchema),

	/**
	 * Optional planned execution date update.
	 * Uses DateSchema for type-safe date handling in YYYY-MM-DD format.
	 */
	planned_for: OptionalDateSchema,

	/**
	 * Optional blocking note update.
	 * Limited to 500 characters. Use empty string to clear existing note.
	 */
	blocked_note: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Task query filters schema for searching and filtering tasks.
 *
 * Supports various filtering options for flexible task retrieval.
 * All filters are optional and can be combined.
 */
export const TaskQuerySchema = Schema.Struct({
	/**
	 * Filter by project assignment.
	 * Use null to get inbox tasks (unassigned).
	 * Use project ID to get tasks from specific project.
	 */
	project_id: Schema.optional(Schema.String),

	/**
	 * Filter by task status.
	 * Useful for getting tasks in specific workflow states.
	 */
	status: Schema.optional(TaskStatusSchema),

	/**
	 * Filter by planned execution date.
	 * Uses DateSchema for type-safe date handling in YYYY-MM-DD format.
	 */
	planned_for: OptionalDateSchema,

	/**
	 * Text search query.
	 * Searches across both title and description fields (case-insensitive).
	 */
	search: Schema.optional(Schema.String),

	/**
	 * Maximum number of results to return.
	 * Must be a positive integer. Defaults to 50 if not specified.
	 */
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),

	/**
	 * Number of results to skip for pagination.
	 * Must be non-negative integer. Used with limit for pagination.
	 */
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

/**
 * Move task to project schema for task reassignment operations.
 *
 * Used specifically for moving tasks between projects or to/from the inbox.
 * This is a specialized operation separate from general task updates.
 */
export const MoveTaskToProjectSchema = Schema.Struct({
	/**
	 * The unique identifier of the task to move.
	 * Must be a valid task ID that the user has access to.
	 */
	task_id: Schema.String,

	/**
	 * Target project for the task.
	 * Use null or undefined to move task to inbox (unassigned state).
	 * Must be a valid project ID that the user has access to.
	 */
	project_id: Schema.optional(Schema.String)
});

// Type exports derived from schema definitions
export type TaskStatus = typeof TaskStatusSchema.Type;
export type CreateTaskInput = typeof CreateTaskSchema.Type;
export type UpdateTaskInput = typeof UpdateTaskSchema.Type;
export type TaskQueryInput = typeof TaskQuerySchema.Type;
export type MoveTaskToProjectInput = typeof MoveTaskToProjectSchema.Type;
