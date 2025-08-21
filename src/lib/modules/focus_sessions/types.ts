import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

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
