import { Schema } from 'effect';

/**
 * Project creation schema
 */
export const CreateProjectSchema = Schema.Struct({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Project update schema
 */
export const UpdateProjectSchema = Schema.Struct({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(500)))
});

/**
 * Project query filters schema
 */
export const ProjectQuerySchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

// Type exports
export type CreateProjectInput = typeof CreateProjectSchema.Type;
export type UpdateProjectInput = typeof UpdateProjectSchema.Type;
export type ProjectQueryInput = typeof ProjectQuerySchema.Type;
