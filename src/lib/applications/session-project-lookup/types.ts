import * as S from 'effect/Schema';
import { FocusSessionSchema } from '$lib/modules/repository/focus_sessions';
import { ProjectSchema } from '$lib/modules/repository/projects';

/**
 * 집중 세션 조회 시, project_id 대신 Project 객체가 필요한 경우 사용
 * project_id가 null인 경우, Project 객체 또한 null이 됨. (수집함)
 */
export const FocusSessionProjectLookupSchema = S.Struct({
	created_at: FocusSessionSchema.fields.created_at,
	end_at: FocusSessionSchema.fields.end_at,
	id: FocusSessionSchema.fields.id,
	owner_id: FocusSessionSchema.fields.owner_id,
	start_at: FocusSessionSchema.fields.start_at,
	updated_at: FocusSessionSchema.fields.updated_at,
	project: S.NullOr(ProjectSchema)
});
