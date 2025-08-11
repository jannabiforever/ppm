import {
	mapPostgrestError,
	SupabasePostgrestError,
	createProjectHasTasksError,
	type DomainError
} from '$lib/shared/errors';
import { Context, Effect, Layer } from 'effect';
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
		) => Effect.Effect<Project | null, SupabasePostgrestError>;
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
	}
>() {}

export const ProjectLive = Layer.effect(
	ProjectService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;

		return {
			createProjectAsync: (input: CreateProjectInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						const insertData: TablesInsert<'projects'> = {
							name: input.name,
							description: input.description
						};

						return Effect.promise(() =>
							client.from('projects').insert(insertData).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getProjectByIdAsync: (id: string) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) =>
						Effect.promise(() => client.from('projects').select().eq('id', id).maybeSingle())
					),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
					)
				),

			getProjectsAsync: (query?: ProjectQueryInput) =>
				supabase.getClientSync().pipe(
					Effect.flatMap((client) => {
						let queryBuilder = client.from('projects').select();

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
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
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

						return Effect.promise(() =>
							client.from('projects').update(updateData).eq('id', id).select().single()
						);
					}),
					Effect.flatMap((res) =>
						res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.data)
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
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.succeed(res.count ?? 0)
						)
					);

					if (taskCount > 0) {
						return yield* Effect.fail(createProjectHasTasksError(taskCount));
					}

					// Proceed with deletion
					return yield* supabase.getClientSync().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() => client.from('projects').delete().eq('id', id))
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error)) : Effect.void
						)
					);
				})
		};
	})
);
