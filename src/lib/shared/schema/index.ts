type OptionalizeUndefined<T> = {
	// 값 타입에 undefined가 들어있는 키들 => optional 로 변환
	[K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
} & {
	// 나머지 키는 그대로
	[K in keyof T as undefined extends T[K] ? never : K]: T[K];
} extends infer O
	? { [K in keyof O]: O[K] }
	: never;

/**
 * 스키마 테스트를 위한 헬퍼 타입.
 * 기본적으로 T: undefined | .. 을 T?: .. 으로 변환하여 비교.
 */
export type Equal<A, B> =
	OptionalizeUndefined<A> extends OptionalizeUndefined<B>
		? OptionalizeUndefined<B> extends OptionalizeUndefined<A>
			? true
			: false
		: false;
