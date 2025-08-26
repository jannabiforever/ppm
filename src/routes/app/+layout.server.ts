import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import { Effect } from 'effect';
import * as Option from 'effect/Option';
import * as Either from 'effect/Either';
import * as Console from 'effect/Console';
import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as Project from '$lib/modules/projects/index.server';
import * as Task from '$lib/modules/tasks/index.server';
import * as SessionTask from '$lib/modules/session_tasks/index.server';
import { StatusCodes } from 'http-status-codes';

/**
 * 네비게이션에는 다음 데이터가 필요함:
 * - 유저와 프로필 정보
 * - 현재 진행 중인 세션 (존재하는 경우에만)
 * - 현재 active 상태의 프로젝트들
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const program = Effect.gen(function* () {
		const projectRepo = yield* Project.Service;
		const taskRepo = yield* Task.Service;
		const sessionTaskRepo = yield* SessionTask.Service;
		const focusSessionRepo = yield* FocusSession.Service;

		const activeProjects = yield* projectRepo.getActiveProjects();
		const currentFocusSession = yield* focusSessionRepo.getActiveFocusSession();

		const assignedTaskIds: string[] = yield* Option.match(currentFocusSession, {
			onSome: (session) =>
				sessionTaskRepo.getTasksBySession(session.id).pipe(
					Effect.map((rels) => rels.map((rel) => rel.task_id)),
					Effect.orElse(() => Effect.succeed([]))
				),
			onNone: () => Effect.succeed([])
		});

		const assignedTasks = yield* Effect.all(assignedTaskIds.map((id) => taskRepo.getTaskById(id)));

		return {
			activeProjects,
			currentSession: {
				session: currentFocusSession,
				assignedTasks
			}
		};
	});

	const p = await program.pipe(
		Effect.provide(Project.Service.Default),
		Effect.provide(Task.Service.Default),
		Effect.provide(SessionTask.Service.Default),
		Effect.provide(FocusSession.Service.Default),
		Effect.provide(locals.supabase),
		Effect.tapError(Console.error),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(p, {
		onRight: (data) => {
			return { ...data, user: locals.user, profile: locals.profile };
		},
		onLeft: (err) => {
			switch (err._tag) {
				case 'NoSessionOrUser':
					return redirect(StatusCodes.UNAUTHORIZED, '/auth/login');
				case 'SupabaseAuth':
					return error(err.status, {
						_tag: err._tag,
						message: err.message
					});
				case 'SupabasePostgrest':
					return error(err.status, {
						_tag: err._tag,
						message: err.message
					});
			}
		}
	});
};
