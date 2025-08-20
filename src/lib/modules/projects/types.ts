import type { Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import * as S from 'effect/Schema';

export type Project = Tables<'projects'>;
export type ProjectInsert = TablesInsert<'projects'>;
export type ProjectUpdate = TablesUpdate<'projects'>;

export const ProjectQuerySchema = S.Struct({
	name_query: S.optional(S.String),
	status: S.optional(S.Boolean)
});
