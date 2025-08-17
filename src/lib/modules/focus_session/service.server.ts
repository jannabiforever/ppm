import { mapPostgrestError, SupabasePostgrestError, type DomainError } from '$lib/shared/errors';
import { Context, Effect, Layer, DateTime, Option, Schema } from 'effect';
import { SupabaseService } from '$lib/modules/supabase/service.server';
import {
	CreateFocusSessionSchema,
	UpdateFocusSessionSchema,
	FocusSessionQuerySchema,
	type FocusSession
} from './schema';
import type { TaskStatus } from '../task';
import type { TablesInsert, TablesUpdate } from '$lib/shared/types';

export class FocusSessionService extends Context.Tag('FocusSession')<
	FocusSessionService,
	{
		/**
		 * Creates a new focus session.
		 *
		 * @param input - The focus session creation parameters
		 * @returns Effect that succeeds with the created FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail (connection, constraint violations, etc.)
		 * @throws {ActiveFocusSessionExistsError} When user already has an active focus session
		 * @throws {ProjectNotFoundError} When specified project_id doesn't exist or user lacks access
		 * @throws {TaskNotFoundError} When any of the specified task_ids don't exist or user lacks access
		 * @throws {InvalidTaskStatusTransitionError} When tasks are not in a valid state for focus session
		 */
		readonly createFocusSession: (
			input: Schema.Schema.Type<typeof CreateFocusSessionSchema>
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;

		/**
		 * Retrieves a focus session by its unique identifier.
		 *
		 * @param id - The unique identifier of the focus session to retrieve
		 * @returns Effect that succeeds with Some(FocusSession) if found, None if not found, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * const session = yield* focusSessionService.getFocusSessionById('session_123');
		 * if (Option.isSome(session)) {
		 *   console.log('Found session:', session.value.id);
		 * }
		 * ```
		 */
		readonly getFocusSessionById: (
			id: string
		) => Effect.Effect<Option.Option<FocusSession>, SupabasePostgrestError>;

		/**
		 * Retrieves a list of focus sessions based on query filters.
		 *
		 * Supports filtering by date range, active status, and project association.
		 * Results are ordered by start time in descending order (most recent first).
		 *
		 * @param query - Optional query filters including date range, active status, and project ID
		 * @returns Effect that succeeds with an array of FocusSession objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * // Get all sessions
		 * const allSessions = yield* focusSessionService.getFocusSessions();
		 *
		 * // Get only active sessions
		 * const activeSessions = yield* focusSessionService.getFocusSessions({ is_active: true });
		 *
		 * // Get sessions for specific project
		 * const projectSessions = yield* focusSessionService.getFocusSessions({ project_id: 'proj_123' });
		 * ```
		 */
		readonly getFocusSessions: (
			query?: Schema.Schema.Type<typeof FocusSessionQuerySchema>
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;

		/**
		 * Retrieves the currently active focus session for the authenticated user.
		 *
		 * An active session is one where closed_at is null. Only one session can be
		 * active per user at any given time.
		 *
		 * @returns Effect that succeeds with Some(FocusSession) if an active session exists,
		 *          None if no active session, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const activeSession = yield* focusSessionService.getActiveFocusSession();
		 * if (Option.isSome(activeSession)) {
		 *   console.log('Active session ends at:', activeSession.value.scheduled_end_at);
		 * } else {
		 *   console.log('No active session found');
		 * }
		 * ```
		 */
		readonly getActiveFocusSession: () => Effect.Effect<
			Option.Option<FocusSession>,
			SupabasePostgrestError
		>;

		/**
		 * Updates an existing focus session with new values.
		 *
		 * Allows partial updates of session properties including project association,
		 * timing adjustments, and session closure. Only provided fields will be updated.
		 *
		 * @param id - The unique identifier of the session to update
		 * @param input - Partial update data containing fields to modify
		 * @returns Effect that succeeds with the updated FocusSession or fails with an error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, session not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Close a session
		 * const closedSession = yield* focusSessionService.updateFocusSession('session_123', {
		 *   closed_at: DateTime.unsafeNow()
		 * });
		 *
		 * // Change project association
		 * const updatedSession = yield* focusSessionService.updateFocusSession('session_123', {
		 *   project_id: 'new_project_id'
		 * });
		 * ```
		 */
		readonly updateFocusSession: (
			id: string,
			input: Schema.Schema.Type<typeof UpdateFocusSessionSchema>
		) => Effect.Effect<FocusSession, SupabasePostgrestError>;

		/**
		 * Permanently deletes a focus session and all its associated data.
		 *
		 * This operation removes the session record and cascades to delete all
		 * session_tasks entries. This action cannot be undone.
		 *
		 * @param id - The unique identifier of the session to delete
		 * @returns Effect that succeeds with void or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, session not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * yield* focusSessionService.deleteFocusSession('session_123');
		 * console.log('Session deleted successfully');
		 * ```
		 */
		readonly deleteFocusSession: (id: string) => Effect.Effect<void, SupabasePostgrestError>;
	}
>() {}

export const FocusSessionLive = Layer.effect(
	FocusSessionService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClient();

		return {
			createFocusSession: (input: Schema.Schema.Type<typeof CreateFocusSessionSchema>) =>
				Effect.gen(function* () {
					// Create the focus session
					const insertData: TablesInsert<'focus_sessions'> = {
						project_id: input.project_id,
						started_at: DateTime.formatIso(input.started_at),
						scheduled_end_at: DateTime.formatIso(input.scheduled_end_at)
					};

					const focusSession = yield* Effect.promise(() =>
						client.from('focus_sessions').insert(insertData).select().single()
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Associate tasks if provided
					if (input.task_ids && input.task_ids.length > 0) {
						const sessionTaskInserts = input.task_ids.map((taskId) => ({
							session_id: focusSession.id,
							task_id: taskId
						}));

						yield* Effect.promise(() =>
							client.from('session_tasks').insert(sessionTaskInserts)
						).pipe(
							Effect.flatMap((res) =>
								res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
							)
						);
					}

					return focusSession;
				}),

			getFocusSessionById: (id: string) =>
				supabase.getClient().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getFocusSessions: (query?: Schema.Schema.Type<typeof FocusSessionQuerySchema>) =>
				Effect.promise(() => {
					let queryBuilder = client.from('focus_sessions').select();

					if (query?.project_id) {
						queryBuilder = queryBuilder.eq('project_id', query.project_id);
					}

					// Note: task_id filtering will be handled post-query due to Supabase limitations

					if (query?.date_from) {
						queryBuilder = queryBuilder.gte('started_at', DateTime.formatIso(query.date_from));
					}

					if (query?.date_to) {
						queryBuilder = queryBuilder.lte('started_at', DateTime.formatIso(query.date_to));
					}

					if (query?.is_active !== undefined) {
						if (query.is_active) {
							queryBuilder = queryBuilder.is('closed_at', null);
						} else {
							queryBuilder = queryBuilder.not('closed_at', 'is', null);
						}
					}

					if (query?.limit) {
						queryBuilder = queryBuilder.limit(query.limit);
					}

					if (query?.offset) {
						queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit ?? 50) - 1);
					}

					queryBuilder = queryBuilder.order('started_at', { ascending: false });

					return queryBuilder;
				}).pipe(
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			getActiveFocusSession: () =>
				supabase.getClient().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('focus_sessions')
								.select()
								.is('closed_at', null)
								.order('started_at', { ascending: false })
								.limit(1)
								.maybeSingle()
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getActiveFocusSessionWithTasks: () =>
				Effect.gen(function* () {
					const activeSession = yield* Effect.promise(() =>
						client
							.from('focus_sessions')
							.select()
							.is('closed_at', null)
							.order('started_at', { ascending: false })
							.limit(1)
							.maybeSingle()
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(Option.fromNullable(res.data))
						)
					);

					if (Option.isNone(activeSession)) return Option.none();

					const sessionTasksWithDetails = yield* Effect.promise(() =>
						client
							.from('session_tasks')
							.select(
								`
								session_id,
								added_at,
								tasks!inner(
									id,
									title,
									description,
									status,
									owner_id,
									blocked_note,
									planned_for,
									created_at,
									updated_at
								)
							`
							)
							.eq('session_id', activeSession.value.id)
							.order('added_at', { ascending: true })
					).pipe(
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.data)
						)
					);

					// Transform the data to match our FocusSessionWithTasks type
					const tasks = sessionTasksWithDetails.map(
						(item: {
							session_id: string;
							added_at: string;
							tasks: {
								id: string;
								title: string;
								description: string | null;
								status: TaskStatus;
								owner_id: string;
								blocked_note: string | null;
								planned_for: string | null;
								created_at: string;
								updated_at: string;
							};
						}) => ({
							added_at: item.added_at,
							id: item.tasks.id,
							title: item.tasks.title,
							description: item.tasks.description,
							status: item.tasks.status,
							owner_id: item.tasks.owner_id,
							blocked_note: item.tasks.blocked_note,
							planned_for: item.tasks.planned_for,
							created_at: item.tasks.created_at,
							updated_at: item.tasks.updated_at
						})
					);

					return Option.map(activeSession, (activeSession) => {
						return { ...activeSession, tasks };
					});
				}),

			updateFocusSession: (
				id: string,
				input: Schema.Schema.Type<typeof UpdateFocusSessionSchema>
			) =>
				supabase.getClient().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'focus_sessions'> = {};

						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.started_at !== undefined)
							updateData.started_at = DateTime.formatIso(input.started_at);
						if (input.scheduled_end_at !== undefined)
							updateData.scheduled_end_at = DateTime.formatIso(input.scheduled_end_at);
						if (input.closed_at !== undefined)
							updateData.closed_at = DateTime.formatIso(input.closed_at);

						return Effect.promise(() =>
							client.from('focus_sessions').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			deleteFocusSession: (id: string) =>
				supabase.getClient().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').delete().eq('id', id))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
					)
				)
		};
	})
);
