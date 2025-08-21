import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type Project = Tables<'projects'>;
export const ProjectSchema = S.Struct({
	active: S.Boolean,
	created_at: S.DateTimeUtc,
	description: S.NullOr(S.String),
	id: S.String,
	name: S.String,
	owner_id: S.String,
	updated_at: S.DateTimeUtc
});

export type ProjectInsert = TablesInsert<'projects'>;
export const ProjectInsertSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.String,
	owner_id: S.String,
	updated_at: S.optional(S.DateTimeUtc)
});

export type ProjectUpdate = TablesUpdate<'projects'>;
export const ProjectUpdateSchema = S.Struct({
	active: S.optional(S.Boolean),
	created_at: S.optional(S.DateTimeUtc),
	description: S.NullishOr(S.String),
	id: S.optional(S.String),
	name: S.optional(S.String),
	owner_id: S.optional(S.String),
	updated_at: S.optional(S.DateTimeUtc)
});

export const ProjectQuerySchema = S.Struct({
	name_query: S.optional(S.String),
	status: S.optional(S.Boolean)
});
