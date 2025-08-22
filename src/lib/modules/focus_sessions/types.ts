import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';
import { PaginationQuerySchema } from '../../shared/pagination';

export type FocusSession = Tables<'focus_sessions'>;
export const FocusSessionSchema = S.Struct({
	created_at: S.String,
	end_at: S.DateTimeUtc,
	id: S.String,
	owner_id: S.String,
	project_id: S.NullOr(S.String),
	start_at: S.DateTimeUtc,
	updated_at: S.DateTimeUtc
});

export type FocusSessionInsert = TablesInsert<'focus_sessions'>;
export const FocusSessionInsertSchema = S.Struct({
	created_at: S.optional(S.DateTimeUtc),
	end_at: S.DateTimeUtc,
	id: S.optional(S.String),
	owner_id: S.String,
	project_id: S.NullishOr(S.String),
	start_at: S.DateTimeUtc,
	updated_at: S.optional(S.DateTimeUtc)
});

export type FocusSessionUpdate = TablesUpdate<'focus_sessions'>;
export const FocusSessionUpdateSchema = S.Struct({
	created_at: S.optional(S.DateTimeUtc),
	end_at: S.optional(S.DateTimeUtc),
	id: S.optional(S.String),
	owner_id: S.optional(S.String),
	project_id: S.NullishOr(S.String),
	start_at: S.optional(S.DateTimeUtc),
	updated_at: S.optional(S.DateTimeUtc)
});

export const FocusSessionQuerySchema = S.extend(
	PaginationQuerySchema,
	S.Struct({
		project_id: S.optional(S.NullOr(S.String)),
		from_date: S.optional(S.DateTimeUtc),
		to_date: S.optional(S.DateTimeUtc),
		is_active: S.optional(S.Boolean)
	})
);
