import { Effect } from 'effect';
import type { ParseError } from 'effect/ParseResult';
import { decodeUnknown, type Schema } from 'effect/Schema';

export function decodeFormData<A>(
	formData: FormData,
	schema: Schema<A>
): Effect.Effect<A, ParseError> {
	return decodeUnknown(schema)(toPlain(formData));
}

function toPlain(fd: FormData): Record<string, unknown> {
	const out: Record<string, unknown> = {};

	for (const [k, v] of fd.entries()) {
		// collect duplicates as array
		if (k in out) {
			const cur = out[k];
			out[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
		} else {
			out[k] = v;
		}
	}

	// downcast single-element arrays to scalar
	for (const k of Object.keys(out)) {
		const val = out[k];
		if (Array.isArray(val) && val.length === 1) {
			out[k] = val[0];
		}
	}

	return out;
}
