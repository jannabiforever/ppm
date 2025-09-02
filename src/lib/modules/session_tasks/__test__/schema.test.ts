import { describe, expect, it } from 'vitest';
import { SessionTaskSchema } from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';
import type { Tables } from '$lib/shared/database.types';

type SessionTask = Tables<'session_tasks'>;

describe('Schema of SessionTask', () => {
	type SessionTaskSchemaEncoded = S.Schema.Encoded<typeof SessionTaskSchema>;

	it('SessionTask and SessionTaskSchema should be compatible', () => {
		const match: Equal<SessionTask, SessionTaskSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
