import { Effect } from 'effect';
import * as Supabase from '../supabase';
import * as S from 'effect/Schema';
import type { Project, ProjectInsert, ProjectQuerySchema, ProjectUpdate } from './types';

export class Service extends Effect.Service<Service>()('ProjectRepository', {
	effect: Effect.gen(function* () {
		const supabase = yield* Supabase.Service;
		const client = yield* supabase.getClient();
		const user = yield* supabase.getUser();

		return {
			/**
			 * 새로운 프로젝트를 생성한다
			 */
			createProject: (payload: ProjectInsert): Effect.Effect<string, Supabase.PostgrestError> =>
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
					Effect.map((project) => project.id)
				),

			/**
			 * 기존 프로젝트의 정보를 수정한다
			 */
			updateProject: (
				project_id: string,
				payload: ProjectUpdate
			): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').update(payload).eq('id', project_id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 프로젝트를 삭제한다
			 */
			deleteProject: (project_id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').delete().eq('id', project_id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 특정 프로젝트의 상세 정보를 조회한다
			 */
			getProjectById: (project_id: string): Effect.Effect<Project, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').select().eq('id', project_id).eq('owner_id', user.id).single()
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse)),

			/**
			 * 조건에 맞는 프로젝트 목록을 조회한다
			 */
			getProjects: (
				query: S.Schema.Type<typeof ProjectQuerySchema>
			): Effect.Effect<Project[], Supabase.PostgrestError> => {
				let queryBuilder = client.from('projects').select().eq('owner_id', user.id);

				if (query.name_query) {
					queryBuilder = queryBuilder.ilike('name', `%${query.name_query}%`);
				}

				if (query.active !== undefined) {
					queryBuilder = queryBuilder.eq('active', query.active);
				}

				return Effect.promise(() => queryBuilder).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			},

			/**
			 * 프로젝트를 아카이브한다 (active를 false로 설정)
			 */
			archiveProject: (id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').update({ active: false }).eq('id', id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 아카이브된 프로젝트를 복원한다 (active를 true로 설정)
			 */
			restoreProject: (id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').update({ active: true }).eq('id', id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),

			/**
			 * 아카이브된 프로젝트 목록을 조회한다
			 */
			getArchivedProjects: (): Effect.Effect<Project[], Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').select().eq('owner_id', user.id).eq('active', false)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse)),

			/**
			 * 활성 프로젝트 목록을 조회한다
			 */
			getActiveProjects: (): Effect.Effect<Project[], Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').select().eq('owner_id', user.id).eq('active', true)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponse)),

			/**
			 * 프로젝트의 활성 상태를 토글한다
			 */
			toggleProjectStatus: (id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.gen(function* () {
					// 먼저 현재 프로젝트 상태를 조회한다
					const active = yield* Effect.promise(() =>
						client.from('projects').select('active').eq('id', id).eq('owner_id', user.id).single()
					).pipe(
						Effect.flatMap(Supabase.mapPostgrestResponse),
						Effect.map((p) => p.active)
					);

					// 상태를 토글한다
					yield* Effect.promise(() =>
						client.from('projects').update({ active: !active }).eq('id', id).eq('owner_id', user.id)
					).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid));
				})
		};
	})
}) {}
