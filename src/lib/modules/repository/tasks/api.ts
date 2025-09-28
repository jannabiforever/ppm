import { Effect, Schema } from 'effect';
import { HttpBody, HttpClient, HttpClientRequest } from '@effect/platform';
import type { TaskInsertSchema, TaskUpdateSchema, TaskQuerySchema } from './types';
import { TaskSchema } from './types';
import { parseOrAppError } from '$lib/shared/errors';

const CreateTaskSchemaResponse = Schema.Struct({
	id: Schema.String
});

const SuccessResponse = Schema.Struct({
	success: Schema.Boolean
});

/**
 * API service for task-related HTTP operations.
 * Provides client-side methods to interact with the task REST API endpoints.
 */
export class ApiService extends Effect.Service<ApiService>()('api/Task', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		const createTask = (payload: Omit<typeof TaskInsertSchema.Encoded, 'owner_id'>) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) => client.post('/api/tasks', { body })),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(CreateTaskSchemaResponse))
			);

		const getTaskById = (taskId: string) =>
			client.get(`/api/tasks/${taskId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(TaskSchema))
			);

		const updateTask = (
			taskId: string,
			payload: Omit<typeof TaskUpdateSchema.Encoded, 'owner_id'>
		) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) =>
					client.execute(HttpClientRequest.patch(`/api/tasks/${taskId}`, { body }))
				),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const deleteTask = (taskId: string) =>
			client.del(`/api/tasks/${taskId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const getTasks = (query?: typeof TaskQuerySchema.Encoded) => {
			const searchParams = new URLSearchParams();
			if (query) {
				Object.entries(query).forEach(([key, value]) => {
					if (value !== undefined) {
						if (key === 'status' && Array.isArray(value)) {
							// For status array, add each status as a separate parameter
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
		};

		const getTodayTasks = () =>
			client.get('/api/tasks/today').pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
			);

		const getTasksByProject = (projectId: string) =>
			client.get(`/api/projects/${projectId}/tasks`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
			);

		const getTasksCompletedInSession = (sessionId: string) =>
			client.get(`/api/sessions/${sessionId}/completed-tasks`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
			);

		const getInboxTasks = () =>
			client.get('/api/tasks/inbox').pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
			);

		const getTasksByStatus = (status: string) =>
			client.get(`/api/tasks/status/${status}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(TaskSchema)))
			);

		return {
			/**
			 * Creates a new task via HTTP POST request.
			 * Owner ID is automatically set by the server based on authentication.
			 *
			 * @param payload - Task data excluding owner_id
			 * @returns Effect containing the created task's ID
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			createTask,

			/**
			 * Retrieves a specific task by its ID via HTTP GET request.
			 *
			 * @param taskId - The ID of the task to retrieve
			 * @returns Effect containing the task data
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTaskById,

			/**
			 * Updates an existing task via HTTP PATCH request.
			 * Owner ID cannot be changed and is excluded from the payload.
			 *
			 * @param taskId - The ID of the task to update
			 * @param payload - Partial task data to update
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			updateTask,

			/**
			 * Deletes a task via HTTP DELETE request.
			 *
			 * @param taskId - The ID of the task to delete
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			deleteTask,

			/**
			 * Retrieves a list of tasks with optional filtering via HTTP GET request.
			 * Supports filtering by title, project, status, and date range.
			 *
			 * @param query - Optional query parameters for filtering
			 * @returns Effect containing an array of tasks
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTasks,

			/**
			 * Retrieves all tasks scheduled for today via HTTP GET request.
			 *
			 * @returns Effect containing an array of today's tasks
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTodayTasks,

			/**
			 * Retrieves all tasks associated with a specific project via HTTP GET request.
			 *
			 * @param projectId - The ID of the project
			 * @returns Effect containing an array of tasks for the project
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTasksByProject,

			/**
			 * Retrieves all tasks completed within a specific focus session via HTTP GET request.
			 *
			 * @param sessionId - The ID of the focus session
			 * @returns Effect containing an array of tasks completed in the session
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTasksCompletedInSession,

			/**
			 * Retrieves all inbox tasks (tasks without a project) via HTTP GET request.
			 *
			 * @returns Effect containing an array of inbox tasks
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getInboxTasks,

			/**
			 * Retrieves all tasks with a specific status via HTTP GET request.
			 *
			 * @param status - The task status to filter by
			 * @returns Effect containing an array of tasks with the specified status
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getTasksByStatus
		};
	})
}) {}
