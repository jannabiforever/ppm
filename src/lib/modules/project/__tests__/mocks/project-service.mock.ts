import { Layer, Effect } from 'effect';
import { ProjectService } from '../../service.server';
import type { Tables } from '$lib/infra/supabase/types';
import type {
	CreateProjectInput,
	UpdateProjectInput,
	ProjectQueryInput
} from '../../schema';

// Mock Project Service
export const createMockProjectService = (
	overrides: Partial<{
		createProjectAsync: (input: CreateProjectInput) => Effect.Effect<Tables<'projects'>, never>;
		getProjectByIdAsync: (id: string) => Effect.Effect<Tables<'projects'> | null, never>;
		getProjectsAsync: (query?: ProjectQueryInput) => Effect.Effect<Tables<'projects'>[], never>;
		updateProjectAsync: (
			id: string,
			input: UpdateProjectInput
		) => Effect.Effect<Tables<'projects'>, never>;
		deleteProjectAsync: (id: string) => Effect.Effect<void, never>;
	}> = {}
) => {
	const defaultProjectService = {
		createProjectAsync: (input: CreateProjectInput) =>
			Effect.succeed({
				id: 'mock_project_id',
				owner_id: 'user_123',
				name: input.name || 'Mock Project',
				description: input.description || null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		getProjectByIdAsync: (id: string) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				name: 'Mock Project',
				description: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		getProjectsAsync: () => Effect.succeed([]),

		updateProjectAsync: (id: string, input: UpdateProjectInput) =>
			Effect.succeed({
				id,
				owner_id: 'user_123',
				name: input.name || 'Updated Project',
				description: input.description || null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>),

		deleteProjectAsync: () => Effect.void
	};

	return Layer.succeed(ProjectService, { ...defaultProjectService, ...overrides });
};

// Error simulation helpers
export const createFailingProjectService = () => {
	return createMockProjectService({
		getProjectByIdAsync: () => Effect.succeed(null),
		updateProjectAsync: () =>
			Effect.succeed({
				id: 'error_project',
				owner_id: 'user_123',
				name: 'Error Project',
				description: null,
				created_at: '2024-01-01T10:00:00Z',
				updated_at: '2024-01-01T10:00:00Z'
			} as Tables<'projects'>)
	});
};
