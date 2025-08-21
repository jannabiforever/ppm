import {
	AuthError as AE,
	PostgrestError as PE,
	type PostgrestMaybeSingleResponse,
	type PostgrestSingleResponse
} from '@supabase/supabase-js';
import { Data, Effect } from 'effect';
import * as Option from 'effect/Option';
import { StorageApiError as SAE } from '@supabase/storage-js';
import { StatusCodes } from 'http-status-codes';

/**
 * 'effect'에서 도입된 에러 태그를 구현하는데 도움을 주는 인증 에러 래퍼 클래스임.
 * 이 클래스는 'effect' 라이브러리의 TaggedError 클래스를 확장해서 Supabase 인증 작업에
 * 특화된 태그 에러를 생성함.
 */
export class AuthError extends Data.TaggedError('SupabaseAuth')<{
	readonly message: string;
	readonly status: number;
}> {
	/**
	 * 네이티브 Supabase AuthError를 SupabaseAuthError로 변환함.
	 * 이 함수는 Effect 기반 애플리케이션에서 에러 처리를 표준화하는데 유용함.
	 *
	 * @param error - 래핑할 원본 Supabase AuthError
	 * @returns 원본 에러를 포함하는 새로운 SupabaseAuthError 인스턴스 반환.
	 */
	constructor(error: AE) {
		super({ message: error.message, status: error.status ?? StatusCodes.INTERNAL_SERVER_ERROR });
	}
}

/**
 * 'effect'에서 도입된 에러 태그를 구현하는데 도움을 주는 스토리지 에러 래퍼 클래스임.
 * 이 클래스는 'effect' 라이브러리의 TaggedError 클래스를 확장해서 Supabase 스토리지 작업에
 * 특화된 태그 에러를 생성함.
 */
export class StorageError extends Data.TaggedError('SupabaseStorageApi')<{
	readonly message: string;
	readonly status: number;
}> {
	constructor(error: SAE) {
		let status: number;

		try {
			status = Number(error.statusCode);
		} catch {
			status = 500;
		}

		super({ message: error.message, status });
	}
}

/**
 * 'effect'에서 도입된 에러 태그를 구현하는데 도움을 주는 PostgreSQL 에러 래퍼 클래스임.
 * 이 클래스는 'effect' 라이브러리의 TaggedError 클래스를 확장해서 Supabase Postgrest 작업에
 * 특화된 태그 에러를 생성함.
 */
export class PostgrestError extends Data.TaggedError('SupabasePostgrest')<{
	readonly message: string;
	readonly status: number;
	readonly code: string;
}> {
	/**
	 * 네이티브 Supabase PostgrestError를 SupabasePostgrestError로 변환함.
	 *
	 * 참고: PostgrestError 객체는 설계상 HTTP 상태 코드를 포함하지 않음.
	 * 전체 컨텍스트를 캡처하려면 PostgrestResponse에서 상태를 전달해:
	 *
	 * @example
	 * ```ts
	 * const result = await supabase.from('table').select();
	 * if (result.error) {
	 *   throw mapPostgrestError(result.error, result.status);
	 * }
	 * ```
	 *
	 * @param error - 래핑할 원본 Supabase PostgrestError
	 * @param status - PostgrestResponse에서 가져온 선택적 HTTP 상태 코드
	 * @returns 표준화된 에러 처리를 갖춘 새 SupabasePostgrestError 인스턴스 반환.
	 */
	constructor(error: PE, status: number) {
		super({ message: error.message, code: error.code, status });
	}

	when<E>(mappers: Record<string, () => E>): PostgrestError | E {
		const mapper = mappers[this.code];
		return mapper ? mapper() : this;
	}
}

export class NoSessionOrUserError extends Data.TaggedError('NoSessionOrUser')<{
	readonly message: string;
}> {
	constructor() {
		super({ message: '세션이 없거나 대응되는 사용자가 없습니다.' });
	}
}

// ------------------------------------------------------------
// 유틸 함수
// ------------------------------------------------------------

export function mapPostgrestResponse<T>(
	res: PostgrestSingleResponse<T>
): Effect.Effect<T, PostgrestError> {
	return res.error
		? Effect.fail(new PostgrestError(res.error, res.status))
		: Effect.succeed(res.data);
}

export function mapPostgrestResponseOptional<T>(
	res: PostgrestMaybeSingleResponse<T>
): Effect.Effect<Option.Option<T>, PostgrestError> {
	return res.error
		? Effect.fail(new PostgrestError(res.error, res.status))
		: Effect.succeed(Option.fromNullable(res.data));
}

export function mapPostgrestResponseVoid<T>(
	res: PostgrestSingleResponse<T>
): Effect.Effect<void, PostgrestError> {
	return res.error ? Effect.fail(new PostgrestError(res.error, res.status)) : Effect.void;
}
