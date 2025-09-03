import type { LayoutServerLoad } from './$types';
import { Effect, Layer, Option, Either, Console } from 'effect';
import { error } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';
import { FocusSession, Project, SessionTask, Task } from '$lib/modules/index.server';
import { FocusSessionTaskManagement } from '$lib/applications/index.server';

/**
 * The navigation requires the following data:
 * - User and profile information
 * - Current ongoing session (only if it exists)
 * - Current active projects
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const programResource = Layer.mergeAll(
		Project.Service.Default,
		FocusSession.Service.Default,
		FocusSessionTaskManagement.Service.Default.pipe(
			Layer.provide(SessionTask.Service.Default),
			Layer.provide(Task.Service.Default),
			Layer.provide(FocusSession.Service.Default)
		)
	).pipe(Layer.provide(locals.supabase));

	const program = Effect.gen(function* () {
		const pService = yield* Project.Service;
		const fsService = yield* FocusSession.Service;
		const stmService = yield* FocusSessionTaskManagement.Service;

		const activeProjects = yield* pService.getActiveProjects();
		const currentFocusSession = yield* fsService.getActiveFocusSession();

		const currentFocusSessionInfo = yield* Option.match(currentFocusSession, {
			onNone: () =>
				Effect.succeed(
					Option.none<typeof FocusSessionTaskManagement.FocusSessionWithAssignedTasksSchema.Type>()
				),
			onSome: (fs) => stmService.getSessionWithAssignedTasks(fs.id).pipe(Effect.map(Option.some))
		});

		return {
			activeProjects,
			currentFocusSessionInfo
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
