import { describe, expect, it } from 'vitest';
import {
	type FocusSession,
	type FocusSessionInsert,
	type FocusSessionUpdate,
	FocusSessionSchema,
	FocusSessionInsertSchema,
	FocusSessionUpdateSchema
} from '..';
import type { Equal } from '$lib/shared/schema';
import * as S from 'effect/Schema';

describe('Schema of FocusSession', () => {
	type FocusSessionSchemaEncoded = S.Schema.Encoded<typeof FocusSessionSchema>;

	it('FocusSession and FocusSessionSchema should be compatible', () => {
		const match: Equal<FocusSession, FocusSessionSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of FocusSessionInsert', () => {
	type FocusSessionInsertSchemaEncoded = S.Schema.Encoded<typeof FocusSessionInsertSchema>;

	it('FocusSessionInsert and FocusSessionInsertSchema should be compatible', () => {
		const match: Equal<FocusSessionInsert, FocusSessionInsertSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of FocusSessionUpdate', () => {
	type FocusSessionUpdateSchemaEncoded = S.Schema.Encoded<typeof FocusSessionUpdateSchema>;

	it('FocusSessionUpdate and FocusSessionUpdateSchema should be compatible', () => {
		const match: Equal<FocusSessionUpdate, FocusSessionUpdateSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
