import { Schema } from 'effect';

import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/types';

export type Project = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

/**
 * Project creation schema
 */
export const CreateProjectSchema = Schema.Struct({
	name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
	active: Schema.optional(Schema.Boolean)
});

/**
 * Project update schema
 */
export const UpdateProjectSchema = Schema.Struct({
	name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))),
	description: Schema.optional(Schema.String.pipe(Schema.maxLength(500))),
	active: Schema.optional(Schema.Boolean)
});

/**
 * Project query filters schema
 */
export const ProjectQuerySchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	active: Schema.optional(Schema.Boolean),
	limit: Schema.optional(Schema.Number.pipe(Schema.positive(), Schema.int())),
	offset: Schema.optional(Schema.Number.pipe(Schema.nonNegative(), Schema.int()))
});

// Type exports
export type CreateProjectInput = typeof CreateProjectSchema.Type;
export type UpdateProjectInput = typeof UpdateProjectSchema.Type;
export type ProjectQueryInput = typeof ProjectQuerySchema.Type;
