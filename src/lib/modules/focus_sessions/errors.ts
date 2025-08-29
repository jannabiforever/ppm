import { Data } from 'effect';

/**
 * 이미 활성 세션이 존재할 때 발생하는 에러
 */
export class ActiveOneAlreadyExists extends Data.TaggedError(
	'FocusSession/ActiveOneAlreadyExists'
)<{
	readonly currentSessionId: string;
	readonly endsAt: string;
}> {}

/**
 * 세션을 찾을 수 없을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('FocusSession/NotFound')<{
	readonly sessionId: string;
}> {}

/**
 * 세션이 활성 상태가 아닐 때 발생하는 에러
 */
export class NotActive extends Data.TaggedError('FocusSession/NotActive')<{
	readonly sessionId: string;
}> {}

/**
 * 세션이 이미 종료되었을 때 발생하는 에러
 */
export class AlreadyEnded extends Data.TaggedError('FocusSession/AlreadyEnded')<{
	readonly sessionId: string;
	readonly endedAt: string;
}> {}

/**
 * 세션 시간이 충돌할 때 발생하는 에러
 */
export class TimeConflict extends Data.TaggedError('FocusSession/TimeConflict')<{
	readonly requestedStart: string;
	readonly requestedEnd: string;
}> {}

/**
 * 세션 소유자가 아닐 때 발생하는 에러
 */
export class NotOwned extends Data.TaggedError('FocusSession/NotOwned')<{
	readonly sessionId: string;
}> {}

/**
 * 세션 시간이 유효하지 않을 때 발생하는 에러
 */
export class InvalidDuration extends Data.TaggedError('FocusSession/InvalidDuration')<{
	readonly duration: number;
}> {}

/**
 * 세션 시작 시간이 종료 시간보다 늦을 때 발생하는 에러 (DB constraint)
 */
export class InvalidTime extends Data.TaggedError('FocusSession/InvalidTime')<{
	readonly start_at: string;
	readonly end_at: string;
}> {}

/**
 * 유효하지 않은 프로젝트에 세션을 연결하려 할 때 발생하는 에러
 */
export class InvalidProject extends Data.TaggedError('FocusSession/InvalidProject')<{
	projectId: string;
}> {}

/**
 * 세션이 다른 리소스에서 참조되고 있어 삭제할 수 없을 때 발생하는 에러
 */
export class HasDependencies extends Data.TaggedError('FocusSession/HasDependencies')<{
	sessionId: string;
}> {}

/**
 * 집중 세션 관련 에러
 */
export type Error =
	| ActiveOneAlreadyExists
	| AlreadyEnded
	| HasDependencies
	| InvalidDuration
	| InvalidProject
	| InvalidTime
	| NotActive
	| NotFound
	| NotOwned
	| TimeConflict;
