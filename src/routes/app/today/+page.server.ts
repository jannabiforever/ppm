import { Effect, DateTime } from 'effect';
import * as Either from 'effect/Either';
import * as Console from 'effect/Console';
import * as Task from '$lib/modules/tasks/index.server';
import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as FocusSessionProjectLookup from '$lib/applications/session-project-lookup/index.server';
import * as Project from '$lib/modules/projects/index.server';

import type { PageServerLoad, Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

export const load: PageServerLoad = async ({ locals }) => {
	const todayTasksAndSessionsResult = await Effect.gen(function* () {
		const taskRepo = yield* Task.Service;
		const focusSessionRepo = yield* FocusSessionProjectLookup.Service;
		const today = yield* DateTime.nowAsDate;
		return {
			todayTasks: yield* taskRepo.getTodayTasks(),
			todaySessions: yield* focusSessionRepo.getFocusSessionProjectLookupsByDate(today)
		};
	}).pipe(
		Effect.provide(FocusSessionProjectLookup.Service.Default),
		Effect.provide(FocusSession.Service.Default),
		Effect.provide(Project.Service.Default),
		Effect.provide(Task.Service.Default),
		Effect.provide(locals.supabase),
		Effect.tapError(Console.error),
		Effect.either,
		Effect.runPromise
	);

	return Either.match(todayTasksAndSessionsResult, {
		onLeft: (err) => {
			switch (err._tag) {
				case 'SupabaseAuth':
					return error(err.status, err);
				case 'SupabasePostgrest':
					return error(err.status, err);
				case 'NoSessionOrUser':
					return redirect(StatusCodes.UNAUTHORIZED, '/auth/login');
			}
		},
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
