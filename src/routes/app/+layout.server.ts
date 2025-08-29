import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as Project from '$lib/modules/projects/index.server';
import * as SessionTask from '$lib/modules/session_tasks/index.server';
import * as Task from '$lib/modules/tasks/index.server';
import type { LayoutServerLoad } from './$types';
import { Effect, Layer, Option, Either, Console } from 'effect';
import { error } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';

/**
 * 네비게이션에는 다음 데이터가 필요함:
 * - 유저와 프로필 정보
 * - 현재 진행 중인 세션 (존재하는 경우에만)
 * - 현재 active 상태의 프로젝트들
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const programResource = Layer.mergeAll(
		Project.Service.Default,
		Task.Service.Default,
		SessionTask.Service.Default,
		FocusSession.Service.Default
	).pipe(Layer.provide(locals.supabase));

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
		Effect.provide(programResource),
		Effect.tapError(Console.error),
		Effect.mapError(mapDomainError),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(p, {
		onRight: (data) => {
			return { ...data, user: locals.user, profile: locals.profile };
		},
		onLeft: (err) => error(err.status, err)
	});
};
