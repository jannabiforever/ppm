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

export class ApiService extends Effect.Service<ApiService>()('api/Project', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			createProject: (payload: Omit<typeof ProjectInsertSchema.Encoded, 'owner_id'>) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) => client.post('/api/projects', { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(CreateProjectSchemaResponse))
				),

			getProjectById: (projectId: string) =>
				client.get(`/api/projects/${projectId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(ProjectSchema))
				),

			updateProject: (
				projectId: string,
				payload: Omit<typeof ProjectUpdateSchema.Encoded, 'owner_id'>
			) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) =>
						client.execute(HttpClientRequest.patch(`/api/projects/${projectId}`, { body }))
					),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			deleteProject: (projectId: string) =>
				client.del(`/api/projects/${projectId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			getProjects: (query?: typeof ProjectQuerySchema.Encoded) => {
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
			},

			archiveProject: (projectId: string) =>
				client.execute(HttpClientRequest.post(`/api/projects/${projectId}/archive`)).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			restoreProject: (projectId: string) =>
				client.execute(HttpClientRequest.post(`/api/projects/${projectId}/restore`)).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			getArchivedProjects: () =>
				client.get('/api/projects/archived').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(ProjectSchema)))
				),

			getActiveProjects: () =>
				client.get('/api/projects/active').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(ProjectSchema)))
				)
		};
	})
}) {}
