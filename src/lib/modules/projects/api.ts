import { Effect, Schema } from 'effect';
import { HttpBody, HttpClient, HttpClientRequest } from '@effect/platform';
import type { ProjectInsertSchema, ProjectUpdateSchema, ProjectQuerySchema } from './types';
import { ProjectSchema } from './types';
import { parseOrAppError } from '$lib/shared/errors';

const CreateProjectSchemaResponse = Schema.Struct({
	id: Schema.String
});

const SuccessResponse = Schema.Struct({
	success: Schema.Boolean
});

/**
 * API service for project-related HTTP operations.
 * Provides client-side methods to interact with the project REST API endpoints.
 */
export class ApiService extends Effect.Service<ApiService>()('api/Project', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		const createProject = (payload: Omit<typeof ProjectInsertSchema.Encoded, 'owner_id'>) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) => client.post('/api/projects', { body })),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(CreateProjectSchemaResponse))
			);

		const getProjectById = (projectId: string) =>
			client.get(`/api/projects/${projectId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(ProjectSchema))
			);

		const updateProject = (
			projectId: string,
			payload: Omit<typeof ProjectUpdateSchema.Encoded, 'owner_id'>
		) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) =>
					client.execute(HttpClientRequest.patch(`/api/projects/${projectId}`, { body }))
				),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const deleteProject = (projectId: string) =>
			client.del(`/api/projects/${projectId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const getProjects = (query?: typeof ProjectQuerySchema.Encoded) => {
			const searchParams = new URLSearchParams();
			if (query) {
				Object.entries(query).forEach(([key, value]) => {
					if (value !== undefined) {
						searchParams.append(key, String(value));
					}
				});
			}
			const queryString = searchParams.toString();
			const url = queryString ? `/api/projects?${queryString}` : '/api/projects';

			return client.get(url).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(ProjectSchema)))
			);
		};

		const archiveProject = (projectId: string) =>
			client.execute(HttpClientRequest.post(`/api/projects/${projectId}/archive`)).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const restoreProject = (projectId: string) =>
			client.execute(HttpClientRequest.post(`/api/projects/${projectId}/restore`)).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const getArchivedProjects = () =>
			client.get('/api/projects/archived').pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(ProjectSchema)))
			);

		const getActiveProjects = () =>
			client.get('/api/projects/active').pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(ProjectSchema)))
			);

		return {
			/**
			 * Creates a new project via HTTP POST request.
			 * Owner ID is automatically set by the server based on authentication.
			 *
			 * @param payload - Project data excluding owner_id
			 * @returns Effect containing the created project's ID
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			createProject,

			/**
			 * Retrieves a specific project by its ID via HTTP GET request.
			 *
			 * @param projectId - The ID of the project to retrieve
			 * @returns Effect containing the project data
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getProjectById,

			/**
			 * Updates an existing project via HTTP PATCH request.
			 * Owner ID cannot be changed and is excluded from the payload.
			 *
			 * @param projectId - The ID of the project to update
			 * @param payload - Partial project data to update
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			updateProject,

			/**
			 * Deletes a project via HTTP DELETE request.
			 *
			 * @param projectId - The ID of the project to delete
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			deleteProject,

			/**
			 * Retrieves a list of projects with optional filtering via HTTP GET request.
			 * Supports filtering by name (partial match) and active status.
			 *
			 * @param query - Optional query parameters for filtering
			 * @returns Effect containing an array of projects
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getProjects,

			/**
			 * Archives a project via HTTP POST request.
			 * Sets the project's active status to false.
			 *
			 * @param projectId - The ID of the project to archive
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			archiveProject,

			/**
			 * Restores an archived project via HTTP POST request.
			 * Sets the project's active status to true.
			 *
			 * @param projectId - The ID of the project to restore
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			restoreProject,

			/**
			 * Retrieves all archived projects via HTTP GET request.
			 *
			 * @returns Effect containing an array of archived projects
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getArchivedProjects,

			/**
			 * Retrieves all active projects via HTTP GET request.
			 *
			 * @returns Effect containing an array of active projects
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getActiveProjects
		};
	})
}) {}
