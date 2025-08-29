import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as FocusSessionProjectLookup from '$lib/applications/session-project-lookup/index.server';
import * as Project from '$lib/modules/projects/index.server';
import * as Task from '$lib/modules/tasks/index.server';
import type { PageServerLoad, Actions } from './$types';
import { Effect, DateTime, Console, Either, Layer } from 'effect';
import { error } from '@sveltejs/kit';
import { mapDomainError } from '$lib/shared/errors';

export const load: PageServerLoad = async ({ locals }) => {
	const programResources = Layer.mergeAll(
		FocusSessionProjectLookup.Service.Default,
		FocusSession.Service.Default,
		Project.Service.Default,
		Task.Service.Default
	).pipe(Layer.provide(locals.supabase));

	const todayTasksAndSessionsResult = await Effect.gen(function* () {
		const taskRepo = yield* Task.Service;
		const focusSessionRepo = yield* FocusSessionProjectLookup.Service;
		const today = yield* DateTime.nowAsDate;
		return {
			todayTasks: yield* taskRepo.getTodayTasks(),
			todaySessions: yield* focusSessionRepo.getFocusSessionProjectLookupsByDate(today)
		};
	}).pipe(
		Effect.provide(programResources),
		Effect.tapError(Console.error),
		Effect.mapError(mapDomainError),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(todayTasksAndSessionsResult, {
		onLeft: (err) => error(err.status, err),
		onRight: (data) => ({
			todayTasks: data.todayTasks,
			todaySessions: data.todaySessions
		})
	});
};

export const actions = {
	createSession: async () => {
		// TODO: implement the api.
	}
} satisfies Actions;
