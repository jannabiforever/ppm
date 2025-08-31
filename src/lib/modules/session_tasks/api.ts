import { Effect, Schema } from 'effect';
import { HttpBody, HttpClient } from '@effect/platform';
import { SessionTaskSchema } from './types';
import { parseOrAppError } from '$lib/shared/errors';

const SuccessResponse = Schema.Struct({
	success: Schema.Boolean
});

const CountResponse = Schema.Struct({
	count: Schema.Number
});

export class ApiService extends Effect.Service<ApiService>()('api/SessionTask', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			// 세션에 태스크 추가
			addTaskToSession: (sessionId: string, taskId: string) =>
				HttpBody.json({ task_id: taskId }).pipe(
					Effect.flatMap((body) => client.post(`/api/sessions/${sessionId}/tasks`, { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			// 세션에서 태스크 제거
			removeTaskFromSession: (sessionId: string, taskId: string) =>
				client.del(`/api/sessions/${sessionId}/tasks/${taskId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			// 여러 태스크를 한번에 추가
			addTasksToSession: (sessionId: string, taskIds: readonly string[]) =>
				HttpBody.json({ task_ids: taskIds }).pipe(
					Effect.flatMap((body) => client.post(`/api/sessions/${sessionId}/tasks/bulk`, { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			// 세션의 모든 태스크 연결 제거
			clearSessionTasks: (sessionId: string) =>
				client.del(`/api/sessions/${sessionId}/tasks`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			// 세션의 태스크 목록 조회
			getTasksBySession: (sessionId: string, query?: { limit?: number; offset?: number }) => {
				const searchParams = new URLSearchParams();
				if (query) {
					Object.entries(query).forEach(([key, value]) => {
						if (value !== undefined) {
							searchParams.append(key, String(value));
						}
					});
				}
				const queryString = searchParams.toString();
				const url = queryString
					? `/api/sessions/${sessionId}/tasks?${queryString}`
					: `/api/sessions/${sessionId}/tasks`;

				return client.get(url).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(SessionTaskSchema)))
				);
			},

			// 태스크가 속한 세션 목록 조회
			getSessionsByTask: (taskId: string, query?: { limit?: number; offset?: number }) => {
				const searchParams = new URLSearchParams();
				if (query) {
					Object.entries(query).forEach(([key, value]) => {
						if (value !== undefined) {
							searchParams.append(key, String(value));
						}
					});
				}
				const queryString = searchParams.toString();
				const url = queryString
					? `/api/tasks/${taskId}/sessions?${queryString}`
					: `/api/tasks/${taskId}/sessions`;

				return client.get(url).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(SessionTaskSchema)))
				);
			},

			// 특정 세션-태스크 연결 조회
			getSessionTask: (sessionId: string, taskId: string) =>
				client.get(`/api/sessions/${sessionId}/tasks/${taskId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SessionTaskSchema))
				),

			// 현재 활성 세션의 태스크 목록
			getActiveSessionTasks: () =>
				client.get('/api/sessions/active/tasks').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Array(SessionTaskSchema)))
				),

			// 태스크가 현재 세션에 있는지 확인
			isTaskInSession: (sessionId: string, taskId: string) =>
				client.get(`/api/sessions/${sessionId}/tasks/${taskId}/exists`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Struct({ exists: Schema.Boolean })))
				),

			// 태스크가 다른 활성 세션에 있는지 확인
			isTaskInActiveSession: (taskId: string) =>
				client.get(`/api/tasks/${taskId}/active-session`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(Schema.Struct({ inActiveSession: Schema.Boolean })))
				),

			// 세션의 태스크 개수 조회
			getSessionTaskCount: (sessionId: string) =>
				client.get(`/api/sessions/${sessionId}/tasks/count`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(CountResponse))
				)
		};
	})
}) {}
