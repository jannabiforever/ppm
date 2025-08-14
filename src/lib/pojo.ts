/**
 * Helper function to create a new POJO object
 */

import * as Option from 'effect/Option';

export function optionToPojo<A>(option: Option.Option<A>): A | null {
	return Option.match(option, {
		onNone: () => null,
		onSome: (value) => value
	});
}
