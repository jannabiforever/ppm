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

export class ApiService extends Effect.Service<ApiService>()('api/FocusSession', {
	effect: Effect.gen(function* () {
		const client = yield* HttpClient.HttpClient;

		return {
			createFocusSession: (payload: Omit<typeof FocusSessionInsertSchema.Encoded, 'owner_id'>) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) => client.post('/api/focus-sessions', { body })),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(CreateFocusSessionSchemaResponse))
				),

			getFocusSessionById: (sessionId: string) =>
				client.get(`/api/focus-sessions/${sessionId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(FocusSessionSchema))
				),

			updateFocusSession: (
				sessionId: string,
				payload: Omit<typeof FocusSessionUpdateSchema.Encoded, 'owner_id'>
			) =>
				HttpBody.json(payload).pipe(
					Effect.flatMap((body) =>
						client.execute(HttpClientRequest.patch(`/api/focus-sessions/${sessionId}`, { body }))
					),
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			deleteFocusSession: (sessionId: string) =>
				client.del(`/api/focus-sessions/${sessionId}`).pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap(parseOrAppError(SuccessResponse))
				),

			getActiveFocusSession: () =>
				client.get('/api/focus-sessions/active').pipe(
					Effect.flatMap((res) => res.json),
					Effect.flatMap((data) =>
						data === null
							? Effect.succeed(Option.none())
							: parseOrAppError(FocusSessionSchema)(data).pipe(Effect.map(Option.some))
					)
				),

			getFocusSessions: (query?: typeof FocusSessionQuerySchema.Encoded) => {
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
			}
		};
	})
}) {}
