import { Data } from 'effect';

/**
 * 이미 활성 세션이 존재할 때 발생하는 에러
 */
export class ActiveOneAlreadyExists extends Data.TaggedError(
	'FocusSession/ActiveOneAlreadyExists'
)<{
	readonly message: string;
	readonly currentSessionId: string;
	readonly endsAt: string;
}> {
	constructor(currentSessionId: string, endsAt: string) {
		super({
			message: `활성 세션이 이미 존재합니다. 현재 세션은 ${new Date(endsAt).toLocaleString()}에 종료됩니다.`,
			currentSessionId,
			endsAt
		});
	}
}

/**
 * 세션을 찾을 수 없을 때 발생하는 에러
 */
export class NotFound extends Data.TaggedError('FocusSession/NotFound')<{
	readonly message: string;
	readonly sessionId: string;
}> {
	constructor(sessionId: string) {
		super({
			message: `세션을 찾을 수 없습니다: ${sessionId}`,
			sessionId
		});
	}
}

/**
 * 세션이 활성 상태가 아닐 때 발생하는 에러
 */
export class NotActive extends Data.TaggedError('FocusSession/NotActive')<{
	readonly message: string;
	readonly sessionId: string;
}> {
	constructor(sessionId: string) {
		super({
			message: `세션이 활성 상태가 아닙니다: ${sessionId}`,
			sessionId
		});
	}
}

/**
 * 세션이 이미 종료되었을 때 발생하는 에러
 */
export class AlreadyEnded extends Data.TaggedError('FocusSession/AlreadyEnded')<{
	readonly message: string;
	readonly sessionId: string;
	readonly endedAt: string;
}> {
	constructor(sessionId: string, endedAt: string) {
		super({
			message: `세션이 이미 ${new Date(endedAt).toLocaleString()}에 종료되었습니다.`,
			sessionId,
			endedAt
		});
	}
}

/**
 * 세션 시간이 충돌할 때 발생하는 에러
 */
export class TimeConflict extends Data.TaggedError('FocusSession/TimeConflict')<{
	readonly message: string;
	readonly conflictingSessionId: string;
	readonly requestedStart: string;
	readonly requestedEnd: string;
}> {
	constructor(conflictingSessionId: string, requestedStart: string, requestedEnd: string) {
		super({
			message: `요청한 시간(${new Date(requestedStart).toLocaleString()} - ${new Date(requestedEnd).toLocaleString()})에 이미 다른 세션이 예약되어 있습니다.`,
			conflictingSessionId,
			requestedStart,
			requestedEnd
		});
	}
}

/**
 * 세션 소유자가 아닐 때 발생하는 에러
 */
export class NotOwned extends Data.TaggedError('FocusSession/NotOwned')<{
	readonly message: string;
	readonly sessionId: string;
}> {
	constructor(sessionId: string) {
		super({
			message: `이 세션에 대한 권한이 없습니다: ${sessionId}`,
			sessionId
		});
	}
}

/**
 * 세션 시간이 유효하지 않을 때 발생하는 에러
 */
export class InvalidDuration extends Data.TaggedError('FocusSession/InvalidDuration')<{
	readonly message: string;
	readonly duration: number;
}> {
	constructor(duration: number) {
		super({
			message: `세션 시간이 유효하지 않습니다: ${duration}분. 세션은 최소 1분, 최대 240분이어야 합니다.`,
			duration
		});
	}
}

/**
 * 세션 시작 시간이 종료 시간보다 늦을 때 발생하는 에러 (DB constraint)
 */
export class InvalidTime extends Data.TaggedError('FocusSession/InvalidTime')<{
	readonly message: string;
	readonly start_at: string;
	readonly end_at: string;
}> {
	constructor(start_at: string, end_at: string) {
		super({
			message: `세션 시작 시간이 종료 시간보다 늦습니다. 시작: ${start_at}, 종료: ${end_at}`,
			start_at,
			end_at
		});
	}
}
