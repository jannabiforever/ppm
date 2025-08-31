import * as S from 'effect/Schema';

/**
 * ID 파라미터 스키마
 */
export const IdParamsSchema = S.Struct({
	id: S.String
});

/**
 * 페이지네이션 파라미터 스키마
 */
export const PaginationParamsSchema = S.Struct({
	page: S.optional(S.NumberFromString),
	limit: S.optional(S.NumberFromString)
});

/**
 * 날짜 범위 파라미터 스키마
 */
export const DateRangeParamsSchema = S.Struct({
	from: S.optional(S.DateTimeUtc),
	to: S.optional(S.DateTimeUtc)
});

/**
 * 정렬 파라미터 스키마
 */
export const SortParamsSchema = S.Struct({
	sort: S.optional(S.String),
	order: S.optional(S.Union(S.Literal('asc'), S.Literal('desc')))
});
