import { Effect, Schema, Option } from 'effect';
import { HttpBody, HttpClient, HttpClientRequest } from '@effect/platform';
import type {
	FocusSessionInsertSchema,
	FocusSessionUpdateSchema,
	FocusSessionQuerySchema
} from './types';
import { FocusSessionSchema } from './types';
import { parseOrAppError } from '$lib/shared/errors';

const CreateFocusSessionSchemaResponse = Schema.Struct({
	id: Schema.String
});

const SuccessResponse = Schema.Struct({
	success: Schema.Boolean
});

/**
 * API service for focus session-related HTTP operations.
 * Provides client-side methods to interact with the focus session REST API endpoints.
 */
export class ApiService extends Effect.Service<ApiService>()('api/FocusSession', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		const createFocusSession = (
			payload: Omit<typeof FocusSessionInsertSchema.Encoded, 'owner_id'>
		) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) => client.post('/api/focus-sessions', { body })),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(CreateFocusSessionSchemaResponse))
			);

		const getFocusSessionById = (sessionId: string) =>
			client.get(`/api/focus-sessions/${sessionId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(FocusSessionSchema))
			);

		const updateFocusSession = (
			sessionId: string,
			payload: Omit<typeof FocusSessionUpdateSchema.Encoded, 'owner_id'>
		) =>
			HttpBody.json(payload).pipe(
				Effect.flatMap((body) =>
					client.execute(HttpClientRequest.patch(`/api/focus-sessions/${sessionId}`, { body }))
				),
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const deleteFocusSession = (sessionId: string) =>
			client.del(`/api/focus-sessions/${sessionId}`).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(SuccessResponse))
			);

		const getActiveFocusSession = () =>
			client.get('/api/focus-sessions/active').pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap((data) =>
					data === null
						? Effect.succeed(Option.none())
						: parseOrAppError(FocusSessionSchema)(data).pipe(Effect.map(Option.some))
				)
			);

		const getFocusSessions = (query?: typeof FocusSessionQuerySchema.Encoded) => {
			const searchParams = new URLSearchParams();
			if (query) {
				Object.entries(query).forEach(([key, value]) => {
					if (value !== undefined) {
						searchParams.append(key, String(value));
					}
				});
			}
			const queryString = searchParams.toString();
			const url = queryString ? `/api/focus-sessions?${queryString}` : '/api/focus-sessions';

			return client.get(url).pipe(
				Effect.flatMap((res) => res.json),
				Effect.flatMap(parseOrAppError(Schema.Array(FocusSessionSchema)))
			);
		};

		return {
			/**
			 * Creates a new focus session via HTTP POST request.
			 * Owner ID is automatically set by the server based on authentication.
			 *
			 * @param payload - Focus session data excluding owner_id
			 * @returns Effect containing the created session's ID
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			createFocusSession,

			/**
			 * Retrieves a specific focus session by its ID via HTTP GET request.
			 *
			 * @param sessionId - The ID of the focus session to retrieve
			 * @returns Effect containing the focus session data
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getFocusSessionById,

			/**
			 * Updates an existing focus session via HTTP PATCH request.
			 * Owner ID cannot be changed and is excluded from the payload.
			 *
			 * @param sessionId - The ID of the focus session to update
			 * @param payload - Partial focus session data to update
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			updateFocusSession,

			/**
			 * Deletes a focus session via HTTP DELETE request.
			 *
			 * @param sessionId - The ID of the focus session to delete
			 * @returns Effect containing success response
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			deleteFocusSession,

			/**
			 * Retrieves the currently active focus session via HTTP GET request.
			 * A session is active when the current time is between its start and end times.
			 *
			 * @returns Effect containing Option of focus session (None if no active session)
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getActiveFocusSession,

			/**
			 * Retrieves a list of focus sessions with optional filtering via HTTP GET request.
			 * Supports filtering by project, date range, and active status.
			 *
			 * @param query - Optional query parameters for filtering
			 * @returns Effect containing an array of focus sessions
			 * @throws {AppError} When the request fails or response parsing fails
			 */
			getFocusSessions
		};
	})
}) {}
