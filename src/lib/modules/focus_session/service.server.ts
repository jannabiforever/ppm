import {
	mapPostgrestError,
	SupabasePostgrestError,
	createActiveFocusSessionExistsError,
	createFocusSessionNotFoundError,
	createFocusSessionAlreadyEndedError,
	type DomainError
} from '$lib/shared/errors';
import { Context, Effect, Layer } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import { TaskService } from '$lib/modules/task/service.server';
import {
	type CreateFocusSessionInput,
	type UpdateFocusSessionInput,
	type StartFocusSessionInput,
	type EndFocusSessionInput,
	type FocusSessionQueryInput
} from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';

export type FocusSession = Tables<'focus_sessions'>;

export class FocusSessionService extends Context.Tag('FocusSession')<
	FocusSessionService,
	{
		readonly createFocusSessionAsync: (
			input: CreateFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError>;
		readonly getFocusSessionByIdAsync: (
			id: string
		) => Effect.Effect<FocusSession | null, SupabasePostgrestError>;
		readonly getFocusSessionsAsync: (
			query?: FocusSessionQueryInput
		) => Effect.Effect<FocusSession[], SupabasePostgrestError>;
		readonly getActiveFocusSessionAsync: () => Effect.Effect<
			FocusSession | null,
			SupabasePostgrestError
		>;
		readonly updateFocusSessionAsync: (
			id: string,
			input: UpdateFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError>;
		readonly startFocusSessionAsync: (
			input: StartFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;
		readonly endFocusSessionAsync: (
			sessionId: string,
			input: EndFocusSessionInput
		) => Effect.Effect<FocusSession, SupabasePostgrestError | DomainError>;
		readonly deleteFocusSessionAsync: (id: string) => Effect.Effect<void, SupabasePostgrestError>;
	}
>() {}

export const FocusSessionLive = Layer.effect(
	FocusSessionService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const taskService = yield* TaskService;

		return {
			createFocusSessionAsync: (input: CreateFocusSessionInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const insertData: TablesInsert<'focus_sessions'> = {
							task_id: input.task_id,
							project_id: input.project_id,
							started_at: input.started_at,
							ended_at: input.ended_at,
							intensity_note: input.intensity_note,
							progress_note: input.progress_note
						};

						return Effect.promise(() =>
							client.from('focus_sessions').insert(insertData).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getFocusSessionByIdAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getFocusSessionsAsync: (query?: FocusSessionQueryInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						let queryBuilder = client.from('focus_sessions').select();

						if (query?.task_id) {
							queryBuilder = queryBuilder.eq('task_id', query.task_id);
						}

						if (query?.project_id) {
							queryBuilder = queryBuilder.eq('project_id', query.project_id);
						}

						if (query?.date_from) {
							queryBuilder = queryBuilder.gte('started_at', query.date_from);
						}

						if (query?.date_to) {
							queryBuilder = queryBuilder.lte('started_at', query.date_to);
						}

						if (query?.limit) {
							queryBuilder = queryBuilder.limit(query.limit);
						}

						if (query?.offset) {
							queryBuilder = queryBuilder.range(
								query.offset,
								query.offset + (query.limit ?? 50) - 1
							);
						}

						queryBuilder = queryBuilder.order('started_at', { ascending: false });

						return Effect.promise(() => queryBuilder);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getActiveFocusSessionAsync: () =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client
								.from('focus_sessions')
								.select()
								.is('ended_at', null)
								.order('started_at', { ascending: false })
								.limit(1)
								.maybeSingle()
						)
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			updateFocusSessionAsync: (id: string, input: UpdateFocusSessionInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'focus_sessions'> = {};

						if (input.task_id !== undefined) updateData.task_id = input.task_id;
						if (input.project_id !== undefined) updateData.project_id = input.project_id;
						if (input.started_at !== undefined) updateData.started_at = input.started_at;
						if (input.ended_at !== undefined) updateData.ended_at = input.ended_at;
						if (input.intensity_note !== undefined)
							updateData.intensity_note = input.intensity_note;
						if (input.progress_note !== undefined) updateData.progress_note = input.progress_note;

						return Effect.promise(() =>
							client.from('focus_sessions').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			startFocusSessionAsync: (input: StartFocusSessionInput) =>
				Effect.gen(function* () {
					// Check if there's already an active session
					const activeSession = yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() =>
								client.from('focus_sessions').select().is('ended_at', null).maybeSingle()
							)
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (activeSession) {
						return yield* Effect.fail(createActiveFocusSessionExistsError());
					}

					// Update task status to in_session if task_id provided
					if (input.task_id) {
						yield* taskService.updateTaskStatusAsync(input.task_id, 'in_session');
					}

					// Create new focus session
					const now = new Date().toISOString();
					const insertData: TablesInsert<'focus_sessions'> = {
						task_id: input.task_id,
						started_at: now
					};

					return yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() =>
								client.from('focus_sessions').insert(insertData).select().single()
							)
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);
				}),

			endFocusSessionAsync: (sessionId: string, input: EndFocusSessionInput) =>
				Effect.gen(function* () {
					const now = new Date().toISOString();

					// Get the session to validate it exists and is active
					const session = yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() =>
								client.from('focus_sessions').select().eq('id', sessionId).maybeSingle()
							)
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					if (!session) {
						return yield* Effect.fail(createFocusSessionNotFoundError(sessionId));
					}

					if (session.ended_at) {
						return yield* Effect.fail(createFocusSessionAlreadyEndedError(sessionId));
					}

					// Update focus session with end time and notes
					const updatedSession = yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) => {
							const updateData: TablesUpdate<'focus_sessions'> = {
								ended_at: now,
								intensity_note: input.intensity_note,
								progress_note: input.progress_note
							};

							return Effect.promise(() =>
								client
									.from('focus_sessions')
									.update(updateData)
									.eq('id', sessionId)
									.select()
									.single()
							);
						}),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
						)
					);

					// Update task status based on completion
					if (session.task_id) {
						const newStatus = input.completed ? 'completed' : 'planned';
						yield* taskService.updateTaskStatusAsync(session.task_id, newStatus);
					}

					return updatedSession;
				}),

			deleteFocusSessionAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('focus_sessions').delete().eq('id', id))
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
					)
				)
		};
	})
);
