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
import { Effect, ParseResult, Schema, Option, Either } from 'effect';
import { StatusCodes } from 'http-status-codes';
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

/**
 * 전송된 데이터 검증 시 에러를 반환. (서버에 전송하기 전 전처리)
 *
 * @param error ParseError
 * @returns
 */
export const mapParseError = (error: ParseResult.ParseError): App.Error => {
	// 문자열로 요약
	const summary = ParseResult.TreeFormatter.formatErrorSync(error);

	return {
		type: error._tag, // "ParseError"
		title: '전송된 데이터에 주요 정보가 누락되었습니다.',
		message: error.message,
		detail: summary,
		status: StatusCodes.UNPROCESSABLE_ENTITY
	};
};

/**
 * ParseError & DomainError 모두 App.Error로 변환
 */
export const mapToAppError = (error: DomainError | ParseResult.ParseError): App.Error => {
	if (error instanceof ParseResult.ParseError) {
		return mapParseError(error);
	}

	return mapDomainError(error);
};

/**
 * App.Error 스키마
 */
export const AppErrorSchema = Schema.Struct({
	type: Schema.String,
	title: Schema.String,
	message: Schema.String,
	detail: Schema.UndefinedOr(Schema.String),
	status: Schema.Number
});

/**
 * Api Response를 App.Error 또는 주어진 schema로 변환하는 함수
 *
 * @param schema Parse할 스키마
 * @returns
 */
export function parseOrAppError<A, I>(
	schema: Schema.Schema<A, I>
): (payload: unknown) => Effect.Effect<A, App.Error | ParseResult.ParseError> {
	return (payload) => {
		const parsedOk = Schema.decodeUnknownOption(schema)(payload);
		if (Option.isSome(parsedOk)) {
			return Effect.succeed(parsedOk.value);
		}

		const parsedErr = Schema.decodeUnknownEither(AppErrorSchema)(payload);
		return Either.match(parsedErr, {
			onLeft: (err) => Effect.fail(err),
			onRight: (err) => Effect.fail(err)
		});
	};
}
