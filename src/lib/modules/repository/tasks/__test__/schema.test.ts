import { describe, expect, it } from 'vitest';
import type { Database, Tables, TablesInsert, TablesUpdate } from '$lib/shared/database.types';
import { TaskSchema, TaskInsertSchema, TaskUpdateSchema, TaskStatusSchema } from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

export type TaskStatus = Database['public']['Enums']['task_status'];
export type Task = Tables<'tasks'>;
export type TaskInsert = TablesInsert<'tasks'>;
export type TaskUpdate = TablesUpdate<'tasks'>;

describe('Schema of TaskStatus', () => {
	type TaskStatusSchemaEncoded = S.Schema.Encoded<typeof TaskStatusSchema>;

	it('TaskStatus and TaskStatusSchema should be compatible', () => {
		const match: Equal<TaskStatus, TaskStatusSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of Task', () => {
	type TaskSchemaEncoded = S.Schema.Encoded<typeof TaskSchema>;

	it('Task and TaskSchema should be compatible', () => {
		const match: Equal<Task, TaskSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of TaskInsert', () => {
	type TaskInsertSchemaEncoded = S.Schema.Encoded<typeof TaskInsertSchema>;

	it('TaskInsert and TaskInsertSchema should be compatible', () => {
		const match: Equal<TaskInsert, TaskInsertSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of TaskUpdate', () => {
	type TaskUpdateSchemaEncoded = S.Schema.Encoded<typeof TaskUpdateSchema>;

	it('TaskUpdate and TaskUpdateSchema should be compatible', () => {
		const match: Equal<TaskUpdate, TaskUpdateSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
