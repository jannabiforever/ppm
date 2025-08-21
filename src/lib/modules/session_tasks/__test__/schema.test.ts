import { describe, expect, it } from 'vitest';
import { type SessionTask, SessionTaskSchema } from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

describe('Schema of SessionTask', () => {
	type SessionTaskSchemaEncoded = S.Schema.Encoded<typeof SessionTaskSchema>;

	it('SessionTask and SessionTaskSchema should be compatible', () => {
		const match: Equal<SessionTask, SessionTaskSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
