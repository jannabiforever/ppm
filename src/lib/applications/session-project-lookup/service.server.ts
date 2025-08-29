import { Effect } from 'effect';
import * as Supabase from '$lib/modules/supabase/index.server';
import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as Project from '$lib/modules/projects/index.server';
import { FocusSessionProjectLookupSchema } from './types';
import { SessionExistsButAssociatedProjectNotFound } from './errors';

export class Service extends Effect.Service<Service>()('app/FocusSessionProjectLookup', {
	effect: Effect.gen(function* () {
		const focusSessionService = yield* FocusSession.Service;
		const projectService = yield* Project.Service;

		const getFocusSessionProjectLookupById = (
			session_id: string
		): Effect.Effect<
			typeof FocusSessionProjectLookupSchema.Type,
			Supabase.PostgrestError | SessionExistsButAssociatedProjectNotFound | FocusSession.NotFound
		> =>
			Effect.gen(function* () {
				const focusSession = yield* focusSessionService.getFocusSessionById(session_id);
				const pid = focusSession.project_id;

				if (pid === null) {
					return { ...focusSession, project: null };
				}

				const project = yield* projectService.getProjectById(pid).pipe(
					Effect.catchTag('Project/NotFound', () =>
						Effect.fail(
							new SessionExistsButAssociatedProjectNotFound({
								sessionId: session_id,
								projectId: pid
							})
						)
					)
				);

				return {
					...focusSession,
					project
				};
			});

		return {
			/**
			 * 세션 ID로 세션과 연관된 프로젝트 정보를 함께 조회한다
			 */
			getFocusSessionProjectLookupById,
			getFocusSessionProjectLookupsByDate: (
				date: Date
			): Effect.Effect<
				(typeof FocusSessionProjectLookupSchema.Type)[],
				Supabase.PostgrestError | SessionExistsButAssociatedProjectNotFound | FocusSession.NotFound
			> =>
				Effect.gen(function* () {
					const focusSessions = yield* focusSessionService.getFocusSessionsByDate(date);
					return yield* Effect.all(
						focusSessions.map((fs) => getFocusSessionProjectLookupById(fs.id))
					);
				})
		};
	})
}) {}
