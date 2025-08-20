import { Effect } from 'effect';
import * as Supabase from '../supabase';
import * as S from 'effect/Schema';
import type { Project, ProjectInsert, ProjectQuerySchema, ProjectUpdate } from './types';

/**
 * 프로젝트 데이터의 생성, 조회, 수정, 삭제를 관리한다
 */
export class Service extends Effect.Service<Service>()('ProjectService', {
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
			updateProject: (payload: ProjectUpdate): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').update(payload).eq('id', payload.id!).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),
			/**
			 * 프로젝트를 삭제한다
			 */
			deleteProject: (id: string): Effect.Effect<void, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').delete().eq('id', id).eq('owner_id', user.id)
				).pipe(Effect.flatMap(Supabase.mapPostgrestResponseVoid)),
			/**
			 * 특정 프로젝트의 상세 정보를 조회한다
			 */
			getProjectById: (id: string): Effect.Effect<Project, Supabase.PostgrestError> =>
				Effect.promise(() =>
					client.from('projects').select().eq('id', id).eq('owner_id', user.id).single()
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

				if (query.status !== undefined) {
					queryBuilder = queryBuilder.eq('active', query.status);
				}

				return Effect.promise(() => queryBuilder).pipe(
					Effect.flatMap(Supabase.mapPostgrestResponse)
				);
			}
		};
	})
}) {}
