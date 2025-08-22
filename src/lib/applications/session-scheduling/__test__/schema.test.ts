import { describe, expect, it } from 'vitest';
import {
	CanStartSessionAtParams,
	CreateSessionWithConflictCheckParams,
	UpdateSessionTimeWithConflictCheckParams,
	TimeConflictCheckResult,
	FindAvailableTimeSlotsParams,
	AvailableTimeSlot,
	type CanStartSessionAtParams as CanStartSessionAtParamsType,
	type CreateSessionWithConflictCheckParams as CreateSessionWithConflictCheckParamsType,
	type UpdateSessionTimeWithConflictCheckParams as UpdateSessionTimeWithConflictCheckParamsType,
	type TimeConflictCheckResult as TimeConflictCheckResultType,
	type FindAvailableTimeSlotsParams as FindAvailableTimeSlotsParamsType,
	type AvailableTimeSlot as AvailableTimeSlotType
} from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

describe('Schema of CanStartSessionAtParams', () => {
	type CanStartSessionAtParamsSchemaType = S.Schema.Type<typeof CanStartSessionAtParams>;

	it('CanStartSessionAtParams type and schema should be compatible', () => {
		const match: Equal<CanStartSessionAtParamsType, CanStartSessionAtParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of CreateSessionWithConflictCheckParams', () => {
	type CreateSessionWithConflictCheckParamsSchemaType = S.Schema.Type<typeof CreateSessionWithConflictCheckParams>;

	it('CreateSessionWithConflictCheckParams type and schema should be compatible', () => {
		const match: Equal<CreateSessionWithConflictCheckParamsType, CreateSessionWithConflictCheckParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of UpdateSessionTimeWithConflictCheckParams', () => {
	type UpdateSessionTimeWithConflictCheckParamsSchemaType = S.Schema.Type<typeof UpdateSessionTimeWithConflictCheckParams>;

	it('UpdateSessionTimeWithConflictCheckParams type and schema should be compatible', () => {
		const match: Equal<UpdateSessionTimeWithConflictCheckParamsType, UpdateSessionTimeWithConflictCheckParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of TimeConflictCheckResult', () => {
	type TimeConflictCheckResultSchemaType = S.Schema.Type<typeof TimeConflictCheckResult>;

	it('TimeConflictCheckResult type and schema should be compatible', () => {
		const match: Equal<TimeConflictCheckResultType, TimeConflictCheckResultSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of FindAvailableTimeSlotsParams', () => {
	type FindAvailableTimeSlotsParamsSchemaType = S.Schema.Type<typeof FindAvailableTimeSlotsParams>;

	it('FindAvailableTimeSlotsParams type and schema should be compatible', () => {
		const match: Equal<FindAvailableTimeSlotsParamsType, FindAvailableTimeSlotsParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of AvailableTimeSlot', () => {
	type AvailableTimeSlotSchemaType = S.Schema.Type<typeof AvailableTimeSlot>;

	it('AvailableTimeSlot type and schema should be compatible', () => {
		const match: Equal<AvailableTimeSlotType, AvailableTimeSlotSchemaType> = true;
		expect(match).toBe(true);
	});
});
