import type { Transport, Transporter } from '@sveltejs/kit';
import * as Option from 'effect/Option';
import * as Either from 'effect/Either';
import * as DateTime from 'effect/DateTime'

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

// ------------------------------------------------------------
// DateTime.Utc 트랜스포터
// ------------------------------------------------------------

const DateTimeUtcTransporter: Transporter = {
  encode: (value) => {
    if (!DateTime.isUtc(value)) return false;
    return [DateTime.formatIsoDateUtc(value)];
  },
  decode: ([utc]: [string]) => DateTime.unsafeMake(utc)
}

export const transport: Transport = {
  Option: OptionTransporter,
  Either: EitherTransporter,
  DateTimeUtc: DateTimeUtcTransporter
};
