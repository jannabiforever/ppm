import * as S from 'effect/Schema';
import { PaginationQuerySchema } from '../../shared/pagination';

/**
 * Schema for a complete focus session entity as stored in the database.
 * Represents a time-bounded session for focused work, optionally linked to a project.
 */
export const FocusSessionSchema = S.Struct({
	created_at: S.DateTimeUtc,
	end_at: S.DateTimeUtc,
	id: S.String,
	owner_id: S.String,
	project_id: S.NullOr(S.String),
	start_at: S.DateTimeUtc,
	updated_at: S.DateTimeUtc
});

/**
 * Schema for creating a new focus session.
 * Most fields are optional as they have default values in the database.
 * The start_at and end_at times are required to define the session boundaries.
 */
export const FocusSessionInsertSchema = S.Struct({
	created_at: S.optional(S.DateTimeUtc),
	end_at: S.DateTimeUtc,
	id: S.optional(S.String),
	owner_id: S.String,
	project_id: S.NullishOr(S.String),
	start_at: S.DateTimeUtc,
	updated_at: S.optional(S.DateTimeUtc)
});

/**
 * Schema for updating an existing focus session.
 * All fields are optional to allow partial updates.
 * Only provided fields will be updated in the database.
 */
export const FocusSessionUpdateSchema = S.Struct({
	created_at: S.optional(S.DateTimeUtc),
	end_at: S.optional(S.DateTimeUtc),
	id: S.optional(S.String),
	owner_id: S.optional(S.String),
	project_id: S.NullishOr(S.String),
	start_at: S.optional(S.DateTimeUtc),
	updated_at: S.optional(S.DateTimeUtc)
});

/**
 * Schema for querying focus sessions with filters and pagination.
 * Extends the base pagination schema with focus session-specific filters.
 */
export const FocusSessionQuerySchema = S.extend(
	PaginationQuerySchema,
	S.Struct({
		project_id: S.optional(S.NullOr(S.String)),
		from_date: S.optional(S.DateTimeUtc),
		to_date: S.optional(S.DateTimeUtc),
		is_active: S.optional(S.Boolean)
	})
);
