import { describe, expect, it } from 'vitest';
import type { Equal } from '$lib/shared/schema';
import * as S from 'effect/Schema';
import type { AppErrorSchema } from '../errors';

describe('Schema of App.Error', () => {
	type AppErrorSchemaEncoded = S.Schema.Encoded<typeof AppErrorSchema>;

	it('AppErrorSchema and App.Error should be compatible', () => {
		const match: Equal<App.Error, AppErrorSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
