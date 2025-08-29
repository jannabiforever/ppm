// 모듈 임포트
import * as FocusSession from '$lib/modules/focus_sessions';
import * as Project from '$lib/modules/projects';
import * as SessionTask from '$lib/modules/session_tasks';
import * as Task from '$lib/modules/tasks';
import * as UserProfile from '$lib/modules/user_profile';
import * as Supabase from '$lib/modules/supabase';

// 애플리케이션 임포트
import * as SessionProjectLookup from '$lib/applications/session-project-lookup';
import * as SessionScheduling from '$lib/applications/session-scheduling';
// import * as SessionTaskManagement from '$lib/applications/session-task-management';

/**
 * 모듈 (외부 api 직접 이용 서비스) 와 관련된 에러 타입
 */
export type ModuleError =
	| FocusSession.Error
	| Project.Error
	| SessionTask.Error
	| Task.Error
	| UserProfile.Error
	| Supabase.Error;

/**
 * 애플리케이션 (내부 서비스에서 파생된 서비스) 와 관련된 에러 타입
 */
export type ApplicationError = SessionProjectLookup.Error | SessionScheduling.Error;

/**
 * 모듈 / 애플리케이션 에러 유니온 타입
 */
export type DomainError =
	| ModuleError
	| ApplicationError
	| Supabase.AuthError
	| Supabase.NoSessionOrUserError;

/**
 * 도메인 에러를 표현 계층, 즉 클라이언트 레벨로 전파할 때
 * SvelteKit에서 정의된 App.Error로 변환함
 *
 * TODO: 각 에러 상황 모두 지원하기
 *
 * @param error 모듈이나 애플리케이션 레벨에서 정의된 도메인 에러
 */
export const mapDomainError = (error: DomainError): App.Error => {
	void { error };
	throw new Error('구현 안 됨');
};
