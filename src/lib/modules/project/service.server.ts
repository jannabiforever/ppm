import {
	mapPostgrestError,
	SupabasePostgrestError,
	ProjectHasTasksError,
	type DomainError
} from '$lib/shared/errors';
import { Context, Effect, Layer, Option } from 'effect';
import { SupabaseService } from '$lib/infra/supabase/layer.server';
import { type CreateProjectInput, type UpdateProjectInput, type ProjectQueryInput } from './schema';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/infra/supabase/types';

export type Project = Tables<'projects'>;

export class ProjectService extends Context.Tag('Project')<
	ProjectService,
	{
		readonly createProjectAsync: (
			input: CreateProjectInput
		) => Effect.Effect<Project, SupabasePostgrestError>;
		readonly getProjectByIdAsync: (
			id: string
		) => Effect.Effect<Option.Option<Project>, SupabasePostgrestError>;
		readonly getProjectsAsync: (
			query?: ProjectQueryInput
		) => Effect.Effect<Project[], SupabasePostgrestError>;
		readonly updateProjectAsync: (
			id: string,
			input: UpdateProjectInput
		) => Effect.Effect<Project, SupabasePostgrestError>;
		readonly deleteProjectAsync: (
			id: string
		) => Effect.Effect<void, SupabasePostgrestError | DomainError>;
		readonly getAllActiveProjectsAsync: () => Effect.Effect<Project[], SupabasePostgrestError>;
		readonly archiveProjectAsync: (id: string) => Effect.Effect<Project, SupabasePostgrestError>;
		readonly restoreProjectAsync: (id: string) => Effect.Effect<Project, SupabasePostgrestError>;
	}
>() {}

export const ProjectLive = Layer.effect(
	ProjectService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClientSync();

		return {
			createProjectAsync: (input: CreateProjectInput) =>
				Effect.promise(() => {
					const insertData: TablesInsert<'projects'> = {
						name: input.name,
						description: input.description,
						active: input.active ?? true
					};

					return client.from('projects').insert(insertData).select().single();
				}).pipe(
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			getProjectByIdAsync: (id: string) =>
				Effect.promise(() => client.from('projects').select().eq('id', id).maybeSingle()).pipe(
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getProjectsAsync: (query?: ProjectQueryInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						let queryBuilder = client.from('projects').select();

						// Filter by active status (default to true if not specified)
						queryBuilder = queryBuilder.eq('active', query?.active ?? true);

						if (query?.name) {
							queryBuilder = queryBuilder.ilike('name', `%${query.name}%`);
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

						queryBuilder = queryBuilder.order('updated_at', { ascending: false });

						return Effect.promise(() => queryBuilder);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			updateProjectAsync: (id: string, input: UpdateProjectInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const updateData: TablesUpdate<'projects'> = {};

						if (input.name !== undefined) {
							updateData.name = input.name;
						}
						if (input.description !== undefined) {
							updateData.description = input.description;
						}
						if (input.active !== undefined) {
							updateData.active = input.active;
						}

						return Effect.promise(() =>
							client.from('projects').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			deleteProjectAsync: (id: string) =>
				Effect.gen(function* () {
					// Check if project has tasks before deletion
					const taskCount = yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() =>
								client.from('tasks').select('id', { count: 'exact' }).eq('project_id', id)
							)
						),
						Effect.flatMap((res) =>
							res.error
								? Effect.fail(mapPostgrestError(res.error, res.status))
								: Effect.succeed(res.count ?? 0)
						)
					);

					if (taskCount > 0) {
						return yield* Effect.fail(new ProjectHasTasksError(taskCount));
					}

					// Perform soft delete by setting active to false instead of hard delete
					return yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() => client.from('projects').update({ active: false }).eq('id', id))
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
						)
					);
				}),

			getAllActiveProjectsAsync: () =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const queryBuilder = client
							.from('projects')
							.select()
							.eq('active', true)
							.order('updated_at', { ascending: false });

						return Effect.promise(() => queryBuilder);
					}),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			archiveProjectAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client.from('projects').update({ active: false }).eq('id', id).select().single()
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				),

			restoreProjectAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() =>
							client.from('projects').update({ active: true }).eq('id', id).select().single()
						)
					),
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(res.data)
					)
				)
		};
	})
);
