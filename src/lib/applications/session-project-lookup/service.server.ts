import { Effect } from 'effect';
import * as Supabase from '$lib/modules/supabase';
import * as FocusSession from '$lib/modules/focus_sessions';
import * as Project from '$lib/modules/projects';
import type { FocusSessionProjectLookup } from './types';
import { SessionExistsButAssociatedProjectNotFound } from './errors';

export class Service extends Effect.Service<Service>()('app/FocusSessionProjectLookup', {
	effect: Effect.gen(function* () {
		const focusSessionService = yield* FocusSession.Service;
		const projectService = yield* Project.Service;

		return {
			getFocusSessionProjectLookupById: (
				session_id: string
			): Effect.Effect<
				FocusSessionProjectLookup,
				Supabase.PostgrestError | SessionExistsButAssociatedProjectNotFound | FocusSession.NotFound
			> =>
				Effect.gen(function* () {
					const focusSession = yield* focusSessionService.getFocusSessionById(session_id);
					const pid = focusSession.project_id;
					if (pid === null) {
						return { ...focusSession, project: null };
					}

					const project = yield* projectService
						.getProjectById(pid)
						.pipe(
							Effect.catchTag('Project/NotFound', () =>
								Effect.fail(new SessionExistsButAssociatedProjectNotFound(session_id, pid))
							)
						);

					return {
						...focusSession,
						project
					};
				})
		};
	})
}) {}
