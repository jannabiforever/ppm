import { Effect, Layer } from 'effect';
import type { LayoutServerLoad } from './$types';
import {
	FocusSessionLive,
	FocusSessionService,
	ProjectLive,
	ProjectService,
	TaskLive
} from '$lib/modules';
import { toObj } from '$lib/shared/errors';
import { error } from '@sveltejs/kit';
import { optionToPojo } from '$lib/pojo';

/**
 * Navigation needs following data:
 * - user
 * - current focus session if exists
 * - current active projects
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const activeProjectsAsync = Effect.gen(function* () {
		const project = yield* ProjectService;
		return yield* project.getAllActiveProjectsAsync();
	}).pipe(Effect.provide(Layer.provide(ProjectLive, locals.supabase)));

	const currentFocusSessionAsync = Effect.gen(function* () {
		const session = yield* FocusSessionService;
		return yield* session.getActiveFocusSessionWithTasksAsync();
	}).pipe(
		Effect.provide(FocusSessionLive),
		Effect.provide(TaskLive),
		Effect.provide(locals.supabase)
	);

	const res = await Effect.all([activeProjectsAsync, currentFocusSessionAsync]).pipe(
		Effect.either,
		Effect.runPromise
	);

	if (res._tag === 'Left') {
		return error(res.left.status, toObj(res.left));
	}

	return {
		userAndProfile: locals.userAndProfile,
		activeProjects: res.right[0],
		currentFocusSession: optionToPojo(res.right[1])
	};
};
