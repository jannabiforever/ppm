import type { Transport, Transporter } from '@sveltejs/kit';
import * as Option from 'effect/Option';
import * as Either from 'effect/Either';

// ------------------------------------------------------------
// Option 트랜스포터
// ------------------------------------------------------------

type OptionObject<T> =
	| {
			_tag: 'None';
	  }
	| {
			_tag: 'Some';
			value: T;
	  };

const OptionTransporter: Transporter = {
	encode: (value) => {
		if (!Option.isOption(value)) return false;
		return Option.isSome(value) ? { _tag: 'Some', value: value.value } : { _tag: 'None' };
	},
	decode: (oo: OptionObject<unknown>) => (oo._tag == 'Some' ? Option.some(oo.value) : Option.none())
};

// ------------------------------------------------------------
// Either 트랜스포터
// ------------------------------------------------------------

type EitherObject<E, A> =
	| {
			_tag: 'Left';
			value: E;
	  }
	| {
			_tag: 'Right';
			value: A;
	  };

const EitherTransporter: Transporter = {
	encode: (value) => {
		if (!Either.isEither(value)) return false;
		return Either.isLeft(value)
			? { _tag: 'Left', value: value.left }
			: { _tag: 'Right', value: value.right };
	},
	decode: (eo: EitherObject<unknown, unknown>) =>
		eo._tag == 'Left' ? Either.left(eo.value) : Either.right(eo.value)
};

// TODO: 에러 트랜스포터
// TODO: 현재 구현으로는 Option.Option<Either.Either<E, A>> 같은 네스팅 되어 있는 경우를 처리할 수 없음.
export const transport: Transport = {
	Option: OptionTransporter,
	Either: EitherTransporter
};
