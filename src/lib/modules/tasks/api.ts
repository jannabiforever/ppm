import { Effect, Schema } from 'effect';
import { HttpBody, HttpClient, HttpClientRequest } from '@effect/platform';
import type {
	TaskInsertSchema,
	TaskUpdateSchema,
	TaskQuerySchema
} from './types';
import { TaskSchema } from './types';
import { parseOrAppError } from '$lib/shared/errors';

const CreateTaskSchemaResponse = Schema.Struct({
	id: Schema.String
});

const SuccessResponse = Schema.Struct({
	success: Schema.Boolean
});

export class ApiService extends Effect.Service<ApiService>()('api/Task', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			createTask: (payload: Omit<typeof TaskInsertSchema.Encoded, 'owner_id'>) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) => client.post('/api/tasks', { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(CreateTaskSchemaResponse))
				),

			getTaskById: (taskId: string) =>
				client.get(`/api/tasks/${taskId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(TaskSchema))
				),

			updateTask: (
				taskId: string,
				payload: Omit<typeof TaskUpdateSchema.Encoded, 'owner_id'>
			) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) =>
						client.execute(HttpClientRequest.patch(`/api/tasks/${taskId}`, { body }))
					),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			deleteTask: (taskId: string) =>
				client.del(`/api/tasks/${taskId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			getTasks: (query?: typeof TaskQuerySchema.Encoded) => {
				const searchParams = new URLSearchParams();
				if (query) {
					Object.entries(query).forEach(([key, value]) => {
						if (value !== undefined) {
							if (key === 'status' && Array.isArray(value)) {
								// status가 배열인 경우 각각을 별도 파라미터로 추가
								value.forEach((status) => searchParams.append('status', status));
							} else {
								searchParams.append(key, String(value));
							}
						}
					});
				}
				const queryString = searchParams.toString();
				const url = queryString ? `/api/tasks?${queryString}` : '/api/tasks';

				return client.get(url).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				);
			},

			getTodayTasks: () =>
				client.get('/api/tasks/today').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				),

			// 프로젝트별 태스크 조회
			getTasksByProject: (projectId: string) =>
				client.get(`/api/projects/${projectId}/tasks`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				),

			// 세션에서 완료된 태스크 조회
			getTasksCompletedInSession: (sessionId: string) =>
				client.get(`/api/sessions/${sessionId}/completed-tasks`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				),

			// 수집함 태스크 조회 (프로젝트가 없는 태스크)
			getInboxTasks: () =>
				client.get('/api/tasks/inbox').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				),

			// 상태별 태스크 조회
			getTasksByStatus: (status: string) =>
				client.get(`/api/tasks/status/${status}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
				)
		};
	})
}) {}
