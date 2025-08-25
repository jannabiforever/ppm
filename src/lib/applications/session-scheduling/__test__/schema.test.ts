import { describe, expect, it } from 'vitest';
import {
	CanStartSessionAtParamsSchema,
	CreateSessionWithConflictCheckParamsSchema,
	UpdateSessionTimeWithConflictCheckParamsSchema,
	TimeConflictCheckResultSchema,
	FindAvailableTimeSlotsParamsSchema,
	AvailableTimeSlotSchema
} from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

describe('Schema of CanStartSessionAtParams', () => {
	type CanStartSessionAtParamsSchemaType = S.Schema.Type<typeof CanStartSessionAtParamsSchema>;

	it('CanStartSessionAtParams type and schema should be compatible', () => {
		const match: Equal<
			typeof CanStartSessionAtParamsSchema.Type,
			CanStartSessionAtParamsSchemaType
		> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of CreateSessionWithConflictCheckParams', () => {
	type CreateSessionWithConflictCheckParamsSchemaType = S.Schema.Type<
		typeof CreateSessionWithConflictCheckParamsSchema
	>;

	it('CreateSessionWithConflictCheckParams type and schema should be compatible', () => {
		const match: Equal<
			typeof CreateSessionWithConflictCheckParamsSchema.Type,
			CreateSessionWithConflictCheckParamsSchemaType
		> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of UpdateSessionTimeWithConflictCheckParams', () => {
	type UpdateSessionTimeWithConflictCheckParamsSchemaType = S.Schema.Type<
		typeof UpdateSessionTimeWithConflictCheckParamsSchema
	>;

	it('UpdateSessionTimeWithConflictCheckParams type and schema should be compatible', () => {
		const match: Equal<
			typeof UpdateSessionTimeWithConflictCheckParamsSchema.Type,
			UpdateSessionTimeWithConflictCheckParamsSchemaType
		> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of TimeConflictCheckResult', () => {
	type TimeConflictCheckResultSchemaType = S.Schema.Type<typeof TimeConflictCheckResultSchema>;

	it('TimeConflictCheckResult type and schema should be compatible', () => {
		const match: Equal<
			typeof TimeConflictCheckResultSchema.Type,
			TimeConflictCheckResultSchemaType
		> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of FindAvailableTimeSlotsParams', () => {
	type FindAvailableTimeSlotsParamsSchemaType = S.Schema.Type<
		typeof FindAvailableTimeSlotsParamsSchema
	>;

	it('FindAvailableTimeSlotsParams type and schema should be compatible', () => {
		const match: Equal<
			typeof FindAvailableTimeSlotsParamsSchema.Type,
			FindAvailableTimeSlotsParamsSchemaType
		> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of AvailableTimeSlot', () => {
	type AvailableTimeSlotSchemaType = S.Schema.Type<typeof AvailableTimeSlotSchema>;

	it('AvailableTimeSlot type and schema should be compatible', () => {
		const match: Equal<typeof AvailableTimeSlotSchema.Type, AvailableTimeSlotSchemaType> = true;
		expect(match).toBe(true);
	});
});
