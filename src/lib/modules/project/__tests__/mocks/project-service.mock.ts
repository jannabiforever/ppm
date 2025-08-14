import { Layer, Effect, Option } from 'effect';
import { ProjectService } from '../../service.server';
import type { Tables } from '$lib/infra/supabase/types';
import type { CreateProjectInput, UpdateProjectInput, ProjectQueryInput } from '../../schema';

// Mock Project Service
export const createMockProjectService = (
	overrides: Partial<{
		createProjectAsync: (input: CreateProjectInput) => Effect.Effect<Tables<'projects'>, never>;
		getProjectByIdAsync: (id: string) => Effect.Effect<Option.Option<Tables<'projects'>>, never>;
		getProjectsAsync: (query?: ProjectQueryInput) => Effect.Effect<Tables<'projects'>[], never>;
		updateProjectAsync: (
			id: string,
			input: UpdateProjectInput
		) => Effect.Effect<Tables<'projects'>, never>;
		deleteProjectAsync: (id: string) => Effect.Effect<void, never>;
		getAllActiveProjectsAsync: () => Effect.Effect<Tables<'projects'>[], never>;
		archiveProjectAsync: (id: string) => Effect.Effect<Tables<'projects'>, never>;
		restoreProjectAsync: (id: string) => Effect.Effect<Tables<'projects'>, never>;
	}> = {}
) => {
	const defaultProjectService = {
		createProjectAsync: (input: CreateProjectInput) =>
			Effect.succeed({
				id: 'mock_project_id',
				owner_id: 'user_123',
				name: input.name || 'Mock Project',
				description: input.description || null,
				active: input.active ?? true,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		getProjectByIdAsync: (id: string) =>
			Effect.succeed(
				Option.some({
					id,
					owner_id: 'user_123',
					name: 'Mock Project',
					description: null,
					active: true,
					created_at: '2024-01-01T10:00:00Z',
					updated_at: '2024-01-01T10:00:00Z'
				} as Tables<'projects'>)
			),

		getProjectsAsync: () => Effect.succeed([]),

		updateProjectAsync: (id: string, input: UpdateProjectInput) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				name: input.name || 'Updated Project',
				description: input.description || null,
				active: input.active ?? true,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		deleteProjectAsync: () => Effect.void,

		getAllActiveProjectsAsync: () =>
			Effect.succeed([
				{
					id: 'active_project_1',
					owner_id: 'user_123',
					name: 'Active Project 1',
					description: 'First active project',
					active: true,
					created_at: '2024-01-01T10:00:00Z',
					updated_at: '2024-01-01T10:00:00Z'
				},
				{
					id: 'active_project_2',
					owner_id: 'user_123',
					name: 'Active Project 2',
					description: null,
					active: true,
					created_at: '2024-01-02T10:00:00Z',
					updated_at: '2024-01-02T10:00:00Z'
				}
			] as Tables<'projects'>[]),

		archiveProjectAsync: (id: string) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				name: 'Archived Project',
				description: null,
				active: false,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		restoreProjectAsync: (id: string) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				name: 'Restored Project',
				description: null,
				active: true,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>)
	};

	return Layer.succeed(ProjectService, { ...defaultProjectService, ...overrides });
};

// Error simulation helpers
export const createFailingProjectService = () => {
	return createMockProjectService({
		getProjectByIdAsync: () => Effect.succeed(Option.none()),
		updateProjectAsync: () =>
			Effect.succeed({
				id: 'error_project',
				owner_id: 'user_123',
				name: 'Error Project',
				description: null,
				active: true,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>)
	});
};
