import { Effect, Option, DateTime } from 'effect';
import * as Supabase from '../../infra/supabase/index.server';
import * as S from 'effect/Schema';
import {
	FocusSessionSchema,
	FocusSessionInsertSchema,
	FocusSessionUpdateSchema,
	FocusSessionQuerySchema
} from './types';
import { PaginationQuerySchema } from '$lib/shared/pagination';
import { NotFound, InvalidProject, HasDependencies, TimeConflict, InvalidTime } from './errors';

/**
 * Focus Session Service
 *
 * A comprehensive service for managing focus sessions. This service provides functionality for
 * creating, updating, deleting, and querying focus sessions with robust error handling for
 * various validation scenarios.
 *
 * The service ensures data integrity by validating:
 * - Project references (ensuring they exist)
 * - Time constraints (start time must be before end time)
 * - Session conflicts (preventing overlapping sessions)
 *
 * It also provides specialized query methods for retrieving sessions by date ranges,
 * project associations, and session status (active, completed, upcoming).
 *
 * All operations are authenticated, ensuring users can only access and modify their own sessions.
 */
export class Service extends Effect.Service<Service>()('supabase/FocusSession', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * Creates a new focus session.
			 *
			 * This method handles the creation process including validation checks for:
			 * - Project validity
			 * - Time constraints (end time must be after start time)
			 * - Conflicts with existing sessions
			 *
			 * @param payload - The focus session creation data (excluding owner_id which is automatically added)
			 * @returns The ID of the newly created focus session
			 * @throws {InvalidProject} When the specified project doesn't exist
			 * @throws {InvalidTime} When end time is not after start time
			 * @throws {TimeConflict} When the session overlaps with an existing session
			 */
			createFocusSession: (
				payload: Omit<typeof FocusSessionInsertSchema.Encoded, 'owner_id'>
			): Effect.Effect<
				string,
				Supabase.PostgrestError | InvalidProject | TimeConflict | InvalidTime
			> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.insert({
							...payload,
							owner_id: user.id
						})
						.select('id')
						.single()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.map((res) => res.id),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<
							never,
							Supabase.PostgrestError | InvalidProject | TimeConflict | InvalidTime
						> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject({ projectId: payload.project_id || '' }));
								}
							}
							if (error.code === '23514') {
								// Check constraint violation
								if (error.message.includes('check_end_after_start')) {
									return Effect.fail(
										new InvalidTime({
											start_at: payload.start_at,
											end_at: payload.end_at
										})
									);
								}
							}
							if (error.code === 'P0001') {
								// Trigger error - overlapping sessions
								if (error.message.includes('overlapping') || error.message.includes('중복')) {
									return Effect.fail(
										new TimeConflict({
											requestedStart: payload.start_at,
											requestedEnd: payload.end_at
										})
									);
								}
							}
							return Effect.fail(error);
						}
					)
				),

			/**
			 * Deletes a focus session.
			 *
			 * Removes a focus session by its ID, but only if it belongs to the current user.
			 * The operation will fail if the session has dependencies or doesn't exist.
			 *
			 * @param sessionId - The unique identifier of the session to delete
			 * @throws {NotFound} When the session does not exist or doesn't belong to the current user
			 * @throws {HasDependencies} When the session has dependent records and cannot be deleted
			 */
			deleteFocusSession: (
				sessionId: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound | HasDependencies> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.delete()
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound({ sessionId })),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(error): Effect.Effect<never, Supabase.PostgrestError | HasDependencies> =>
							error.code === '23503'
								? Effect.fail(new HasDependencies({ sessionId }))
								: Effect.fail(error)
					)
				),

			/**
			 * Retrieves detailed information about a specific focus session.
			 *
			 * Fetches a focus session by its ID, ensuring it belongs to the current user.
			 *
			 * @param sessionId - The unique identifier of the session to retrieve
			 * @returns The complete focus session data
			 * @throws {NotFound} When the session does not exist or doesn't belong to the current user
			 */
			getFocusSessionById: (
				sessionId: string
			): Effect.Effect<typeof FocusSessionSchema.Type, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: (session) =>
								S.decode(FocusSessionSchema)(session).pipe(
									Effect.mapError(() => new NotFound({ sessionId }))
								),
							onNone: () => Effect.fail(new NotFound({ sessionId }))
						})
					)
				),

			/**
			 * Updates an existing focus session's information.
			 *
			 * Modifies a focus session by its ID, applying the provided changes.
			 * Similar to creation, this handles validation for project, time constraints, and conflicts.
			 *
			 * @param sessionId - The unique identifier of the session to update
			 * @param payload - The updated session data (excluding owner_id)
			 * @throws {NotFound} When the session does not exist or doesn't belong to the current user
			 * @throws {InvalidProject} When the specified project doesn't exist
			 * @throws {InvalidTime} When end time is not after start time
			 * @throws {TimeConflict} When the updated session would overlap with another existing session
			 */
			updateFocusSession: (
				sessionId: string,
				payload: Omit<typeof FocusSessionUpdateSchema.Encoded, 'owner_id'>
			): Effect.Effect<
				void,
				Supabase.PostgrestError | NotFound | InvalidProject | TimeConflict | InvalidTime
			> =>
				Effect.promise(() =>
					client
						.from('focus_sessions')
						.update(payload)
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onNone: () => Effect.fail(new NotFound({ sessionId })),
							onSome: () => Effect.void
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(
							error
						): Effect.Effect<
							never,
							Supabase.PostgrestError | InvalidProject | TimeConflict | InvalidTime
						> => {
							if (error.code === '23503') {
								// Foreign key constraint violation
								if (error.message.includes('project_id')) {
									return Effect.fail(new InvalidProject({ projectId: payload.project_id || '' }));
								}
							}
							if (error.code === '23514') {
								// Check constraint violation
								if (error.message.includes('check_end_after_start')) {
									return Effect.fail(
										new InvalidTime({
											start_at: payload.start_at || '',
											end_at: payload.end_at || ''
										})
									);
								}
							}
							if (error.code === 'P0001') {
								// Trigger error - overlapping sessions
								if (error.message.includes('overlapping') || error.message.includes('중복')) {
									return Effect.fail(
										new TimeConflict({
											requestedStart: payload.start_at || '',
											requestedEnd: payload.end_at || ''
										})
									);
								}
							}
							return Effect.fail(error);
						}
					)
				),

			/**
			 * Retrieves focus sessions based on specified criteria.
			 *
			 * Queries focus sessions with optional filtering by project, date range, and active status.
			 * Results can be paginated and are ordered by start time (newest first).
			 *
			 * @param query - Optional query parameters for filtering, pagination, and sorting
			 * @returns An array of focus sessions matching the criteria
			 */
			getFocusSessions: (
				query?: typeof FocusSessionQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					// Decode query for Date types
					const decodedQuery = query
						? yield* S.decode(FocusSessionQuerySchema)(query).pipe(Effect.orDie)
						: undefined;

					let queryBuilder = client.from('focus_sessions').select().eq('owner_id', user.id);

					if (decodedQuery?.project_id !== undefined) {
						queryBuilder =
							decodedQuery.project_id === null
								? queryBuilder.is('project_id', null)
								: queryBuilder.eq('project_id', decodedQuery.project_id);
					}

					if (decodedQuery?.from_date) {
						queryBuilder = queryBuilder.gte('start_at', DateTime.formatIso(decodedQuery.from_date));
					}

					if (decodedQuery?.to_date) {
						queryBuilder = queryBuilder.lte('start_at', DateTime.formatIso(decodedQuery.to_date));
					}

					if (decodedQuery?.is_active) {
						const now = DateTime.formatIso(DateTime.unsafeNow());
						queryBuilder = queryBuilder.lte('start_at', now).gte('end_at', now);
					}

					queryBuilder = queryBuilder.order('start_at', { ascending: false });

					if (decodedQuery?.limit) {
						queryBuilder = queryBuilder.limit(decodedQuery.limit);
					}

					if (decodedQuery?.offset) {
						queryBuilder = queryBuilder.range(
							decodedQuery.offset,
							decodedQuery.offset + (decodedQuery.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => queryBuilder).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves the currently active focus session, if any exists.
			 *
			 * An active session is defined as one where the current time falls between
			 * the session's start and end times (start_at <= now <= end_at).
			 *
			 * @returns An option containing the active focus session if one exists, or none
			 */
			getActiveFocusSession: (): Effect.Effect<
				Option.Option<typeof FocusSessionSchema.Type>,
				Supabase.PostgrestError
			> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());
				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.lte('start_at', now)
						.gte('end_at', now)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap((option) =>
						Option.match(option, {
							onNone: () => Effect.succeed(Option.none()),
							onSome: (session) =>
								S.decode(FocusSessionSchema)(session).pipe(Effect.map(Option.some), Effect.orDie)
						})
					)
				);
			},

			/**
			 * Retrieves focus sessions associated with a specific project.
			 *
			 * Fetches all sessions belonging to a given project, with optional pagination.
			 * Results are ordered by start time (newest first).
			 *
			 * @param projectId - The unique identifier of the project
			 * @param pagination - Optional pagination parameters
			 * @returns An array of focus sessions associated with the specified project
			 */
			getFocusSessionsOfCertainProject: (
				projectId: string,
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.eq('project_id', projectId)
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves focus sessions for a specific date.
			 *
			 * Fetches all sessions that started on the specified date (00:00:00 to 23:59:59).
			 * Results are ordered by start time (earliest first).
			 *
			 * @param date - The date to query sessions for
			 * @returns An array of focus sessions that started on the specified date
			 */
			getFocusSessionsByDate: (
				date: Date
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const startOfDay = new Date(date);
					startOfDay.setHours(0, 0, 0, 0);
					const endOfDay = new Date(date);
					endOfDay.setHours(23, 59, 59, 999);

					const response = yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.select()
							.eq('owner_id', user.id)
							.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startOfDay)))
							.lt('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endOfDay)))
							.order('start_at', { ascending: true })
					).pipe(Effect.flatMap(Supabase.mapPostgrestResponse));

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves focus sessions within a specified date range.
			 *
			 * Fetches all sessions that started between the given start and end dates,
			 * with optional pagination. Results are ordered by start time (newest first).
			 *
			 * @param startDate - The beginning of the date range (inclusive)
			 * @param endDate - The end of the date range (inclusive)
			 * @param pagination - Optional pagination parameters
			 * @returns An array of focus sessions within the specified date range
			 */
			getFocusSessionsInRange: (
				startDate: Date,
				endDate: Date,
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.gte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(startDate)))
						.lte('start_at', DateTime.formatIso(DateTime.unsafeFromDate(endDate)))
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves upcoming focus sessions (sessions that haven't started yet).
			 *
			 * Fetches all sessions scheduled to start after the current time,
			 * with optional pagination. Results are ordered by start time (earliest first).
			 *
			 * @param pagination - Optional pagination parameters
			 * @returns An array of upcoming focus sessions
			 */
			getUpcomingFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					const now = DateTime.formatIso(DateTime.unsafeNow());
					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.gt('start_at', now)
						.order('start_at', { ascending: true });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves completed focus sessions (sessions that have ended).
			 *
			 * Fetches all sessions that ended before the current time,
			 * with optional pagination. Results are ordered by end time (most recently ended first).
			 *
			 * @param pagination - Optional pagination parameters
			 * @returns An array of completed focus sessions
			 */
			getCompletedFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.lt('end_at', DateTime.formatIso(DateTime.unsafeNow()))
						.order('end_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Retrieves focus sessions that are not associated with any project (inbox sessions).
			 *
			 * Fetches all sessions where project_id is null, with optional pagination.
			 * Results are ordered by start time (newest first).
			 *
			 * @param pagination - Optional pagination parameters
			 * @returns An array of focus sessions without project association
			 */
			getInboxFocusSessions: (
				pagination?: typeof PaginationQuerySchema.Encoded
			): Effect.Effect<Array<typeof FocusSessionSchema.Type>, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					const decodedPagination = pagination
						? yield* S.decode(PaginationQuerySchema)(pagination).pipe(Effect.orDie)
						: undefined;

					let query = client
						.from('focus_sessions')
						.select()
						.eq('owner_id', user.id)
						.is('project_id', null)
						.order('start_at', { ascending: false });

					if (decodedPagination?.limit) {
						query = query.limit(decodedPagination.limit);
					}
					if (decodedPagination?.offset) {
						query = query.range(
							decodedPagination.offset,
							decodedPagination.offset + (decodedPagination.limit || 20) - 1
						);
					}

					const response = yield* Effect.promise(() => query).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse)
					);

					return yield* Effect.all(
						response.map((session) => S.decode(FocusSessionSchema)(session).pipe(Effect.orDie))
					);
				}),

			/**
			 * Checks if a specific focus session is currently active.
			 *
			 * A session is active when the current time falls between its start and end times.
			 * This method first verifies the session exists and belongs to the current user.
			 *
			 * @param sessionId - The unique identifier of the session to check
			 * @returns True if the session exists and is currently active, false otherwise
			 * @throws {NotFound} When the session does not exist or doesn't belong to the current user
			 */
			isFocusSessionActive: (
				sessionId: string
			): Effect.Effect<boolean, Supabase.PostgrestError | NotFound> => {
				const now = DateTime.formatIso(DateTime.unsafeNow());

				return Effect.promise(() =>
					client
						.from('focus_sessions')
						.select('id,start_at,end_at')
						.eq('id', sessionId)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap((session) =>
						Option.match(session, {
							onSome: (session) => Effect.succeed(session.start_at <= now && session.end_at >= now),
							onNone: () => Effect.fail(new NotFound({ sessionId }))
						})
					)
				);
			}
		};
	})
}) {}
