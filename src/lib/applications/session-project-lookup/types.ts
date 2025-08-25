import type { FocusSession } from '$lib/modules/focus_sessions';
import type { Project } from '$lib/modules/projects';

/**
 * 집중 세션 조회 시, project_id 대신 Project 객체가 필요한 경우 사용
 * project_id가 null인 경우, Project 객체 또한 null이 됨. (수집함)
 */
export type FocusSessionProjectLookup = Omit<FocusSession, 'project_id'> & {
	project: Project | null;
};
