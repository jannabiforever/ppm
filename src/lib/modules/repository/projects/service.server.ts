import { Effect } from 'effect';
import * as Option from 'effect/Option';
import * as Supabase from '../../infra/supabase/index.server';
import * as S from 'effect/Schema';
import {
	ProjectSchema,
	ProjectInsertSchema,
	ProjectUpdateSchema,
	ProjectQuerySchema
} from './types';
import { NotFound, NameAlreadyExists, HasDependencies } from './errors';

/**
 * Service class for managing projects in the database.
 * Provides comprehensive CRUD operations and project state management.
 */
export class Service extends Effect.Service<Service>()('ProjectService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		const createProject = (
			payload: typeof ProjectInsertSchema.Encoded
		): Effect.Effect<string, Supabase.PostgrestError | NameAlreadyExists> =>
			Effect.promise(() =>
				client
					.from('projects')
					.insert({
						...payload,
						owner_id: user.id
					})
					.select()
					.single()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.map((project) => project.id),
				Effect.catchTag(
					'SupabasePostgrest',
					(error): Effect.Effect<never, Supabase.PostgrestError | NameAlreadyExists> => {
						if (error.code === '23505')
							return Effect.fail(new NameAlreadyExists({ name: payload.name }));
						else return Effect.fail(error);
					}
				)
			);

		const updateProject = (
			project_id: string,
			payload: typeof ProjectUpdateSchema.Encoded
		): Effect.Effect<void, Supabase.PostgrestError | NotFound | NameAlreadyExists> =>
			Effect.promise(() =>
				client
					.from('projects')
					.update(payload)
					.eq('id', project_id)
					.eq('owner_id', user.id)
					.select('id')
					.maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap(
					Option.match({
						onSome: () => Effect.void,
						onNone: () => Effect.fail(new NotFound({ projectId: project_id }))
					})
				),
				Effect.catchTag(
					'SupabasePostgrest',
					(error): Effect.Effect<never, Supabase.PostgrestError | NameAlreadyExists> =>
						error.code === '23505'
							? Effect.fail(new NameAlreadyExists({ name: payload.name || '' }))
							: Effect.fail(error)
				)
			);

		const deleteProject = (
			projectId: string
		): Effect.Effect<void, Supabase.PostgrestError | NotFound | HasDependencies> =>
			Effect.promise(() =>
				client
					.from('projects')
					.delete()
					.eq('id', projectId)
					.eq('owner_id', user.id)
					.select('id')
					.maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap(
					Option.match({
						onSome: () => Effect.void,
						onNone: () => Effect.fail(new NotFound({ projectId }))
					})
				),
				Effect.catchTag(
					'SupabasePostgrest',
					(error): Effect.Effect<never, Supabase.PostgrestError | HasDependencies> =>
						error.code === '23503'
							? Effect.fail(new HasDependencies({ projectId }))
							: Effect.fail(error)
				)
			);

		const getProjectById = (
			projectId: string
		): Effect.Effect<typeof ProjectSchema.Type, Supabase.PostgrestError | NotFound> =>
			Effect.promise(() =>
				client.from('projects').select().eq('id', projectId).eq('owner_id', user.id).maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap(
					Option.match({
						onSome: (project) =>
							S.decode(ProjectSchema)(project).pipe(
								Effect.mapError(() => new NotFound({ projectId }))
							),
						onNone: () => Effect.fail(new NotFound({ projectId }))
					})
				)
			);

		const getProjects = (
			query: typeof ProjectQuerySchema.Encoded
		): Effect.Effect<Array<typeof ProjectSchema.Type>, Supabase.PostgrestError> => {
			let queryBuilder = client.from('projects').select().eq('owner_id', user.id);

			if (query.name_query) {
				queryBuilder = queryBuilder.ilike('name', `%${query.name_query}%`);
			}

			if (query.active !== undefined) {
				queryBuilder = queryBuilder.eq('active', query.active);
			}

			return Effect.promise(() => queryBuilder).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.flatMap((projects) =>
					Effect.all(projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie)))
				)
			);
		};

		const archiveProject = (
			projectId: string
		): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
			Effect.promise(() =>
				client
					.from('projects')
					.update({ active: false })
					.eq('id', projectId)
					.eq('owner_id', user.id)
					.select('id')
					.maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap(
					Option.match({
						onSome: () => Effect.void,
						onNone: () => Effect.fail(new NotFound({ projectId }))
					})
				)
			);

		const restoreProject = (
			projectId: string
		): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
			Effect.promise(() =>
				client
					.from('projects')
					.update({ active: true })
					.eq('id', projectId)
					.eq('owner_id', user.id)
					.select('id')
					.maybeSingle()
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponseOptional),
				Effect.flatMap(
					Option.match({
						onSome: () => Effect.void,
						onNone: () => Effect.fail(new NotFound({ projectId }))
					})
				)
			);

		const getArchivedProjects = (): Effect.Effect<
			Array<typeof ProjectSchema.Type>,
			Supabase.PostgrestError
		> =>
			Effect.promise(() =>
				client.from('projects').select().eq('owner_id', user.id).eq('active', false)
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.flatMap((projects) =>
					Effect.all(projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie)))
				)
			);

		const getActiveProjects = (): Effect.Effect<
			Array<typeof ProjectSchema.Type>,
			Supabase.PostgrestError
		> =>
			Effect.promise(() =>
				client.from('projects').select().eq('owner_id', user.id).eq('active', true)
			).pipe(
				Effect.flatMap(Supabase.mapPostgrestResponse),
				Effect.flatMap((projects) =>
					Effect.all(projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie)))
				)
			);

		return {
			/**
			 * Creates a new project for the authenticated user.
			 * The project name must be unique among the user's projects.
			 *
			 * @param payload - The project data to create
			 * @returns Effect containing the created project's ID
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NameAlreadyExists} When a project with the same name already exists
			 */
			createProject,

			/**
			 * Updates an existing project's information.
			 * Only the project owner can update their projects.
			 *
			 * @param project_id - The ID of the project to update
			 * @param payload - The project data to update (partial)
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NotFound} When the project doesn't exist or isn't owned by the user
			 * @throws {NameAlreadyExists} When trying to rename to an existing project name
			 */
			updateProject,

			/**
			 * Deletes a project permanently from the database.
			 * The project cannot be deleted if it has dependencies (tasks, sessions, etc.).
			 *
			 * @param projectId - The ID of the project to delete
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NotFound} When the project doesn't exist or isn't owned by the user
			 * @throws {HasDependencies} When the project has dependent resources
			 */
			deleteProject,

			/**
			 * Retrieves detailed information about a specific project.
			 * Only returns projects owned by the authenticated user.
			 *
			 * @param projectId - The ID of the project to retrieve
			 * @returns Effect containing the project data
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NotFound} When the project doesn't exist or isn't owned by the user
			 */
			getProjectById,

			/**
			 * Retrieves a list of projects matching the specified criteria.
			 * Supports filtering by name (partial match) and active status.
			 *
			 * @param query - The query parameters for filtering projects
			 * @returns Effect containing an array of projects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getProjects,

			/**
			 * Archives a project by setting its active status to false.
			 * Archived projects are hidden from normal views but can be restored.
			 *
			 * @param projectId - The ID of the project to archive
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NotFound} When the project doesn't exist or isn't owned by the user
			 */
			archiveProject,

			/**
			 * Restores an archived project by setting its active status to true.
			 * Makes the project visible in normal views again.
			 *
			 * @param projectId - The ID of the project to restore
			 * @returns Effect containing void or an error
			 * @throws {Supabase.PostgrestError} When database operation fails
			 * @throws {NotFound} When the project doesn't exist or isn't owned by the user
			 */
			restoreProject,

			/**
			 * Retrieves all archived (inactive) projects for the authenticated user.
			 * Useful for displaying archived projects in a separate view.
			 *
			 * @returns Effect containing an array of archived projects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getArchivedProjects,

			/**
			 * Retrieves all active projects for the authenticated user.
			 * This is the default view for listing user's projects.
			 *
			 * @returns Effect containing an array of active projects
			 * @throws {Supabase.PostgrestError} When database operation fails
			 */
			getActiveProjects
		};
	})
}) {}
