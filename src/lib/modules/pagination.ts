import * as S from 'effect/Schema';

export const DEFAULT_LIMIT = 20;
export const DEFAULT_OFFSET = 0;

export const PaginationQuerySchema = S.Struct({
	limit: S.optionalWith(S.NonNegativeInt, { default: () => DEFAULT_LIMIT }),
	offset: S.optionalWith(S.NonNegativeInt, { default: () => DEFAULT_OFFSET })
});

// ------------------------------------------------------------
// 페이지네이션 관련 유틸 함수
// ------------------------------------------------------------

/**
 *
 * @param page 페이지 인덱스. 1부터 시작.
 * @param count 페이지에 보여질 항목 수.
 */
export const getPagination = (
	page: number,
	count: number = DEFAULT_LIMIT
): typeof PaginationQuerySchema.Type => {
	return PaginationQuerySchema.make({
		limit: count,
		offset: (page - 1) * count
	});
};
