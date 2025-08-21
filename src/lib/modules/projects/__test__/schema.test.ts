import { describe, expect, it } from 'vitest';
import {
	ProjectInsertSchema,
	ProjectSchema,
	ProjectUpdateSchema,
	type Project,
	type ProjectInsert,
	type ProjectUpdate
} from '..';
import * as S from 'effect/Schema';
import type { Equal } from '$lib/shared/schema';

describe('Schema of Project', () => {
	type ProjectSchemaEncoded = S.Schema.Encoded<typeof ProjectSchema>;

	it('Project and ProjectSchema should be compatible', () => {
		const match: Equal<Project, ProjectSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of ProjectInsert', () => {
	type ProjectInsertSchemaEncoded = S.Schema.Encoded<typeof ProjectInsertSchema>;

	it('ProjectInsert and ProjectInsertSchema should be compatible', () => {
		const match: Equal<ProjectInsert, ProjectInsertSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});

describe('Schema of ProjectUpdate', () => {
	type ProjectUpdateSchemaEncoded = S.Schema.Encoded<typeof ProjectUpdateSchema>;

	it('ProjectUpdate and ProjectUpdateSchema should be compatible', () => {
		const match: Equal<ProjectUpdate, ProjectUpdateSchemaEncoded> = true;
		expect(match).toBe(true);
	});
});
