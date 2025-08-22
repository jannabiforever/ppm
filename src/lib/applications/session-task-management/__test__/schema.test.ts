import { describe, expect, it } from 'vitest';
import {
	AddTaskToSessionParams,
	RemoveTaskFromSessionParams,
	AddTasksToSessionParams,
	ClearSessionTasksParams,
	CanAddTaskToSessionParams,
	type AddTaskToSessionParams as AddTaskToSessionParamsType,
	type RemoveTaskFromSessionParams as RemoveTaskFromSessionParamsType,
	type AddTasksToSessionParams as AddTasksToSessionParamsType,
	type ClearSessionTasksParams as ClearSessionTasksParamsType,
	type CanAddTaskToSessionParams as CanAddTaskToSessionParamsType
} from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

describe('Schema of AddTaskToSessionParams', () => {
	type AddTaskToSessionParamsSchemaType = S.Schema.Type<typeof AddTaskToSessionParams>;

	it('AddTaskToSessionParams type and schema should be compatible', () => {
		const match: Equal<AddTaskToSessionParamsType, AddTaskToSessionParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of RemoveTaskFromSessionParams', () => {
	type RemoveTaskFromSessionParamsSchemaType = S.Schema.Type<typeof RemoveTaskFromSessionParams>;

	it('RemoveTaskFromSessionParams type and schema should be compatible', () => {
		const match: Equal<RemoveTaskFromSessionParamsType, RemoveTaskFromSessionParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of AddTasksToSessionParams', () => {
	type AddTasksToSessionParamsSchemaType = S.Schema.Type<typeof AddTasksToSessionParams>;

	it('AddTasksToSessionParams type and schema should be compatible', () => {
		const match: Equal<AddTasksToSessionParamsType, AddTasksToSessionParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of ClearSessionTasksParams', () => {
	type ClearSessionTasksParamsSchemaType = S.Schema.Type<typeof ClearSessionTasksParams>;

	it('ClearSessionTasksParams type and schema should be compatible', () => {
		const match: Equal<ClearSessionTasksParamsType, ClearSessionTasksParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of CanAddTaskToSessionParams', () => {
	type CanAddTaskToSessionParamsSchemaType = S.Schema.Type<typeof CanAddTaskToSessionParams>;

	it('CanAddTaskToSessionParams type and schema should be compatible', () => {
		const match: Equal<CanAddTaskToSessionParamsType, CanAddTaskToSessionParamsSchemaType> = true;
		expect(match).toBe(true);
	});
});
