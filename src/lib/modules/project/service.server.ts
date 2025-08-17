import {
	mapPostgrestError,
	SupabasePostgrestError,
	ProjectHasTasksError,
	type DomainError
} from '$lib/shared/errors';
import { Context, Effect, Layer, Option, Schema } from 'effect';
import { SupabaseService } from '$lib/modules/supabase';
import {
	CreateProjectSchema,
	UpdateProjectSchema,
	ProjectQuerySchema,
	type Project,
	type ProjectInsert,
	type ProjectUpdate
} from './schema';

export class ProjectService extends Context.Tag('Project')<
	ProjectService,
	{
		/**
		 * Creates a new project for the authenticated user.
		 *
		 * Creates a project with the provided name and description. Projects are
		 * automatically set as active unless explicitly specified otherwise.
		 *
		 * @param input - The project creation parameters including name, description, and active status
		 * @returns Effect that succeeds with the created Project or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail (connection issues, constraint violations, access denied)
		 *
		 * @example
		 * ```typescript
		 * const newProject = yield* projectService.createProject({
		 *   name: 'My New Project',
		 *   description: 'A project for organizing tasks',
		 *   active: true
		 * });
		 * console.log('Created project:', newProject.id);
		 * ```
		 */
		readonly createProject: (
			input: Schema.Schema.Type<typeof CreateProjectSchema>
		) => Effect.Effect<Project, SupabasePostgrestError>;

		/**
		 * Retrieves a project by its unique identifier.
		 *
		 * Performs a secure lookup that only returns projects owned by the authenticated user.
		 * Returns None if the project doesn't exist or the user lacks access.
		 *
		 * @param id - The unique identifier of the project to retrieve
		 * @returns Effect that succeeds with Some(Project) if found, None if not found, or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const project = yield* projectService.getProjectById('proj_123');
		 * if (Option.isSome(project)) {
		 *   console.log('Found project:', project.value.name);
		 * } else {
		 *   console.log('Project not found or access denied');
		 * }
		 * ```
		 */
		readonly getProjectById: (
			id: string
		) => Effect.Effect<Option.Option<Project>, SupabasePostgrestError>;

		/**
		 * Retrieves a list of projects based on query filters.
		 *
		 * Supports filtering by name (case-insensitive partial match), active status,
		 * and pagination. Results are ordered by last update time (most recent first).
		 * Defaults to showing only active projects unless specified otherwise.
		 *
		 * @param query - Optional query filters including name search, active status, and pagination
		 * @returns Effect that succeeds with an array of Project objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or access is denied
		 *
		 * @example
		 * ```typescript
		 * // Get all active projects
		 * const activeProjects = yield* projectService.getProjects();
		 *
		 * // Search for projects by name
		 * const searchResults = yield* projectService.getProjects({
		 *   name: 'work',
		 *   limit: 10
		 * });
		 *
		 * // Get archived projects
		 * const archivedProjects = yield* projectService.getProjects({ active: false });
		 * ```
		 */
		readonly getProjects: (
			query?: Schema.Schema.Type<typeof ProjectQuerySchema>
		) => Effect.Effect<Project[], SupabasePostgrestError>;

		/**
		 * Updates an existing project with new values.
		 *
		 * Allows partial updates of project properties. Only provided fields will be updated,
		 * leaving other properties unchanged. All updates are atomic.
		 *
		 * @param id - The unique identifier of the project to update
		 * @param input - Partial update data containing fields to modify
		 * @returns Effect that succeeds with the updated Project or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, project not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * // Update project name
		 * const updatedProject = yield* projectService.updateProject('proj_123', {
		 *   name: 'Updated Project Name'
		 * });
		 *
		 * // Update description only
		 * const updatedProject = yield* projectService.updateProject('proj_123', {
		 *   description: 'New description'
		 * });
		 * ```
		 */
		readonly updateProject: (
			id: string,
			input: Schema.Schema.Type<typeof UpdateProjectSchema>
		) => Effect.Effect<Project, SupabasePostgrestError>;

		/**
		 * Deletes a project if it has no associated tasks.
		 *
		 * Performs a soft delete by setting the project's active status to false.
		 * Validates that the project has no tasks before deletion to maintain data integrity.
		 * Projects with tasks must have their tasks moved or deleted first.
		 *
		 * @param id - The unique identifier of the project to delete
		 * @returns Effect that succeeds with void or fails with validation or database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, project not found, or access denied
		 * @throws {ProjectHasTasksError} When project still has associated tasks that prevent deletion
		 *
		 * @example
		 * ```typescript
		 * try {
		 *   yield* projectService.deleteProject('proj_123');
		 *   console.log('Project deleted successfully');
		 * } catch (error) {
		 *   if (error instanceof ProjectHasTasksError) {
		 *     console.log(`Cannot delete: project has ${error.taskCount} tasks`);
		 *   }
		 * }
		 * ```
		 */
		readonly deleteProject: (
			id: string
		) => Effect.Effect<void, SupabasePostgrestError | DomainError>;

		/**
		 * Retrieves all active projects for the authenticated user.
		 *
		 * This is a convenience method that fetches all projects where active=true,
		 * ordered by most recently updated. Commonly used for project selection dropdowns.
		 *
		 * @returns Effect that succeeds with an array of active Project objects or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database query fails or authentication is invalid
		 *
		 * @example
		 * ```typescript
		 * const activeProjects = yield* projectService.getAllActiveProjects();
		 * console.log(`User has ${activeProjects.length} active projects`);
		 * activeProjects.forEach(p => console.log(`- ${p.name}`));
		 * ```
		 */
		readonly getAllActiveProjects: () => Effect.Effect<Project[], SupabasePostgrestError>;

		/**
		 * Archives a project by setting its active status to false.
		 *
		 * Archived projects are hidden from default views but retain all their data.
		 * Tasks associated with archived projects remain accessible. This is a soft
		 * delete operation that can be reversed with restoreProject.
		 *
		 * @param id - The unique identifier of the project to archive
		 * @returns Effect that succeeds with the archived Project or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, project not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * const archivedProject = yield* projectService.archiveProject('proj_123');
		 * console.log('Project archived:', archivedProject.name);
		 * console.log('Active status:', archivedProject.active); // false
		 * ```
		 */
		readonly archiveProject: (id: string) => Effect.Effect<Project, SupabasePostgrestError>;

		/**
		 * Restores an archived project by setting its active status to true.
		 *
		 * Brings back a previously archived project to active status, making it
		 * visible in default project listings and available for new task creation.
		 *
		 * @param id - The unique identifier of the project to restore
		 * @returns Effect that succeeds with the restored Project or fails with database error
		 *
		 * @throws {SupabasePostgrestError} When database operations fail, project not found, or access denied
		 *
		 * @example
		 * ```typescript
		 * const restoredProject = yield* projectService.restoreProject('proj_123');
		 * console.log('Project restored:', restoredProject.name);
		 * console.log('Active status:', restoredProject.active); // true
		 * ```
		 */
		readonly restoreProject: (id: string) => Effect.Effect<Project, SupabasePostgrestError>;
	}
>() {}

export const ProjectLive = Layer.effect(
	ProjectService,
	Effect.gen(function* () {
		const supabase = yield* SupabaseService;
		const client = yield* supabase.getClient();

		return {
			createProject: (input: Schema.Schema.Type<typeof CreateProjectSchema>) =>
				Effect.promise(() => {
					const insertData: ProjectInsert = {
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

			getProjectById: (id: string) =>
				Effect.promise(() => client.from('projects').select().eq('id', id).maybeSingle()).pipe(
					Effect.flatMap((res) =>
						res.error
							? Effect.fail(mapPostgrestError(res.error, res.status))
							: Effect.succeed(Option.fromNullable(res.data))
					)
				),

			getProjects: (query?: Schema.Schema.Type<typeof ProjectQuerySchema>) =>
				supabase.getClient().pipe(
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

			updateProject: (id: string, input: Schema.Schema.Type<typeof UpdateProjectSchema>) =>
				supabase.getClient().pipe(
					Effect.flatMap((client) => {
						const updateData: ProjectUpdate = {};

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

			deleteProject: (id: string) =>
				Effect.gen(function* () {
					// Check if project has tasks before deletion
					const taskCount = yield* supabase.getClient().pipe(
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
					return yield* supabase.getClient().pipe(
						Effect.flatMap((client) =>
							Effect.promise(() => client.from('projects').update({ active: false }).eq('id', id))
						),
						Effect.flatMap((res) =>
							res.error ? Effect.fail(mapPostgrestError(res.error, res.status)) : Effect.void
						)
					);
				}),

			getAllActiveProjects: () =>
				supabase.getClient().pipe(
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

			archiveProject: (id: string) =>
				supabase.getClient().pipe(
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

			restoreProject: (id: string) =>
				supabase.getClient().pipe(
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
