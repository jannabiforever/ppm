import * as S from 'effect/Schema';

/**
 * Schema for a complete project entity as stored in the database.
 * Represents all fields of a project including timestamps and metadata.
 */
export const ProjectSchema = S.Struct({
	active: S.Boolean,
	created_at: S.DateTimeUtc,
	description: S.NullOr(S.String),
	id: S.String,
	name: S.String,
	owner_id: S.String,
	updated_at: S.DateTimeUtc
});

/**
 * Schema for creating a new project.
 * Most fields are optional as they have default values in the database.
 * The 'name' field is required and must be unique per user.
 */
export const ProjectInsertSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.String,
	owner_id: S.String,
	updated_at: S.optional(S.DateTimeUtc)
});

/**
 * Schema for updating an existing project.
 * All fields are optional to allow partial updates.
 * Only provided fields will be updated in the database.
 */
export const ProjectUpdateSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.optional(S.String),
	owner_id: S.optional(S.String),
	updated_at: S.optional(S.DateTimeUtc)
});

/**
 * Schema for querying projects with filters.
 * Used to search and filter projects based on various criteria.
 */
export const ProjectQuerySchema = S.Struct({
	name_query: S.optional(S.String),
	active: S.optional(S.Boolean)
});
