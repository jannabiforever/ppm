import { TaskLive, TaskService, FocusSessionService, FocusSessionLive } from '$lib/modules';
import { Console, DateTime, Effect, Either, Layer } from 'effect';
import type { PageServerLoad, Actions } from './$types';
import { error } from '@sveltejs/kit';
import { toObj } from '$lib/shared/errors';

export const load: PageServerLoad = async ({ locals }) => {
	const todayTasksAndSessionsResult = await Effect.gen(function* () {
		const taskService = yield* TaskService;
		const focusSessionService = yield* FocusSessionService;
		const today = yield* DateTime.now;
		return {
			todayTasks: yield* taskService.getTasksAsync({ planned_for: today }),
			todaySessions: yield* focusSessionService.getFocusSessionsWithTasksAsync({
				date_from: today,
				date_to: today
			})
		};
	}).pipe(
		Effect.provide(Layer.merge(TaskLive, FocusSessionLive)),
		Effect.provide(TaskLive),
		Effect.provide(locals.supabase),
		Effect.tapError(Console.error),
		Effect.either,
		Effect.runPromise
	);

	if (Either.isLeft(todayTasksAndSessionsResult)) {
		const err = todayTasksAndSessionsResult.left;
		error(err.status, toObj(err));
	}

	return {
		todayTasks: todayTasksAndSessionsResult.right.todayTasks,
		todaySessions: todayTasksAndSessionsResult.right.todaySessions
	};
};

export const actions = {
	createSession: async () => {
		// TODO: implement the api.
	}
} satisfies Actions;
