import { Effect } from 'effect';
import * as Option from 'effect/Option';
import * as Supabase from '../supabase/index.server';
import * as S from 'effect/Schema';
import {
	ProjectSchema,
	ProjectInsertSchema,
	ProjectUpdateSchema,
	ProjectQuerySchema
} from './types';
import { NotFound, NameAlreadyExists, InvalidOwner, HasDependencies } from './errors';

export class Service extends Effect.Service<Service>()('ProjectService', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * 새로운 프로젝트를 생성한다
			 */
			createProject: (
				payload: typeof ProjectInsertSchema.Encoded
			): Effect.Effect<string, Supabase.PostgrestError | NameAlreadyExists | InvalidOwner> =>
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
						(
							error
						): Effect.Effect<never, Supabase.PostgrestError | NameAlreadyExists | InvalidOwner> =>
							error.code === '23505'
								? Effect.fail(new NameAlreadyExists(payload.name))
								: error.code === '23503'
									? Effect.fail(new InvalidOwner(user.id))
									: Effect.fail(error)
					)
				),

			/**
			 * 기존 프로젝트의 정보를 수정한다
			 */
			updateProject: (
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
							onNone: () => Effect.fail(new NotFound(project_id))
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(error): Effect.Effect<never, Supabase.PostgrestError | NameAlreadyExists> =>
							error.code === '23505'
								? Effect.fail(new NameAlreadyExists(payload.name || ''))
								: Effect.fail(error)
					)
				),

			/**
			 * 프로젝트를 삭제한다
			 */
			deleteProject: (
				project_id: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound | HasDependencies> =>
				Effect.promise(() =>
					client
						.from('projects')
						.delete()
						.eq('id', project_id)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: () => Effect.void,
							onNone: () => Effect.fail(new NotFound(project_id))
						})
					),
					Effect.catchTag(
						'SupabasePostgrest',
						(error): Effect.Effect<never, Supabase.PostgrestError | HasDependencies> =>
							error.code === '23503'
								? Effect.fail(new HasDependencies(project_id))
								: Effect.fail(error)
					)
				),

			/**
			 * 특정 프로젝트의 상세 정보를 조회한다
			 */
			getProjectById: (
				project_id: string
			): Effect.Effect<typeof ProjectSchema.Type, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('projects')
						.select()
						.eq('id', project_id)
						.eq('owner_id', user.id)
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: (project) =>
								S.decode(ProjectSchema)(project).pipe(
									Effect.mapError(() => new NotFound(project_id))
								),
							onNone: () => Effect.fail(new NotFound(project_id))
						})
					)
				),

			/**
			 * 조건에 맞는 프로젝트 목록을 조회한다
			 */
			getProjects: (
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
						Effect.all(
							projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie))
						)
					)
				);
			},

			/**
			 * 프로젝트를 아카이브한다 (active를 false로 설정)
			 */
			archiveProject: (
				project_id: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('projects')
						.update({ active: false })
						.eq('id', project_id)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: () => Effect.void,
							onNone: () => Effect.fail(new NotFound(project_id))
						})
					)
				),

			/**
			 * 아카이브된 프로젝트를 복원한다 (active를 true로 설정)
			 */
			restoreProject: (
				project_id: string
			): Effect.Effect<void, Supabase.PostgrestError | NotFound> =>
				Effect.promise(() =>
					client
						.from('projects')
						.update({ active: true })
						.eq('id', project_id)
						.eq('owner_id', user.id)
						.select('id')
						.maybeSingle()
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponseOptional),
					Effect.flatMap(
						Option.match({
							onSome: () => Effect.void,
							onNone: () => Effect.fail(new NotFound(project_id))
						})
					)
				),

			/**
			 * 아카이브된 프로젝트 목록을 조회한다
			 */
			getArchivedProjects: (): Effect.Effect<
				Array<typeof ProjectSchema.Type>,
				Supabase.PostgrestError
			> =>
				Effect.promise(() =>
					client.from('projects').select().eq('owner_id', user.id).eq('active', false)
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((projects) =>
						Effect.all(
							projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie))
						)
					)
				),

			/**
			 * 활성 프로젝트 목록을 조회한다
			 */
			getActiveProjects: (): Effect.Effect<
				Array<typeof ProjectSchema.Type>,
				Supabase.PostgrestError
			> =>
				Effect.promise(() =>
					client.from('projects').select().eq('owner_id', user.id).eq('active', true)
				).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse),
					Effect.flatMap((projects) =>
						Effect.all(
							projects.map((project) => S.decode(ProjectSchema)(project).pipe(Effect.orDie))
						)
					)
				)
		};
	})
}) {}
