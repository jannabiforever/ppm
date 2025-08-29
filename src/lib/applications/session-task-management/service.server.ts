import { Effect } from 'effect';
import * as Option from 'effect/Option';
import * as FocusSession from '$lib/modules/focus_sessions/index.server';
import * as SessionTask from '$lib/modules/session_tasks/index.server';
import * as Task from '$lib/modules/tasks/index.server';
import * as Supabase from '$lib/modules/supabase/index.server';
import { TaskAlreadyInSessionError, TaskNotInSessionError } from '$lib/modules/session_tasks';
import {
	AddTaskToSessionSchema,
	RemoveTaskFromSessionSchema,
	AddTasksToSessionSchema,
	ClearSessionTasksSchema,
	CanAddTaskToSessionSchema,
	FocusSessionWithAssignedTasksSchema
} from './types';

/**
 * 세션 태스크 관리 애플리케이션 서비스
 *
 * 활성 세션에 대한 태스크 추가/제거 등의 비즈니스 로직을 처리한다
 */
export class Service extends Effect.Service<Service>()('SessionTaskManagement', {
	effect: Effect.gen(function* () {
		const focusSessionsService = yield* FocusSession.Service;
		const sessionTasksService = yield* SessionTask.Service;
		const taskService = yield* Task.Service;

		/**
		 * 활성 세션에 태스크를 추가한다
		 */
		const addTaskToSession = (
			params: typeof AddTaskToSessionSchema.Type
		): Effect.Effect<
			void,
			| FocusSession.NotActive
			| FocusSession.NotFound
			| Supabase.PostgrestError
			| TaskAlreadyInSessionError
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isFocusSessionActive(params.session_id);
				if (!isActive) {
					return yield* Effect.fail(new FocusSession.NotActive({ sessionId: params.session_id }));
				}

				// 이미 추가되어 있는지 확인
				const existing = yield* sessionTasksService.getSessionTask(params);
				if (Option.isSome(existing)) {
					return yield* Effect.fail(
						new TaskAlreadyInSessionError({
							taskId: params.task_id,
							sessionId: params.session_id
						})
					);
				}

				// 태스크 추가
				yield* sessionTasksService.addTaskToSession(params);
			});

		/**
		 * 활성 세션에서 태스크를 제거한다
		 */
		const removeTaskFromSession = (
			params: typeof RemoveTaskFromSessionSchema.Type
		): Effect.Effect<
			void,
			| FocusSession.NotFound
			| TaskNotInSessionError
			| Supabase.PostgrestError
			| FocusSession.NotActive
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isFocusSessionActive(params.session_id);
				if (!isActive) {
					return yield* Effect.fail(new FocusSession.NotActive({ sessionId: params.session_id }));
				}

				// 존재하는지 확인
				const existing = yield* sessionTasksService.getSessionTask(params);
				if (Option.isNone(existing)) {
					return yield* Effect.fail(
						new TaskNotInSessionError({
							taskId: params.task_id,
							sessionId: params.session_id
						})
					);
				}

				// 태스크 제거
				yield* sessionTasksService.removeTaskFromSession(params);
			});

		/**
		 * 활성 세션에 여러 태스크를 한번에 추가한다
		 */
		const addTasksToSession = (
			params: typeof AddTasksToSessionSchema.Type
		): Effect.Effect<
			void,
			FocusSession.NotFound | FocusSession.NotActive | Supabase.PostgrestError
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isFocusSessionActive(params.session_id);
				if (!isActive) {
					return yield* Effect.fail(new FocusSession.NotActive({ sessionId: params.session_id }));
				}

				// 태스크들 추가
				yield* sessionTasksService.addTasksToSession(params);
			});

		/**
		 * 활성 세션의 모든 태스크를 제거한다
		 */
		const clearSessionTasks = (
			params: typeof ClearSessionTasksSchema.Type
		): Effect.Effect<
			void,
			FocusSession.NotActive | Supabase.PostgrestError | FocusSession.NotFound
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isFocusSessionActive(params.session_id);
				if (!isActive) {
					return yield* Effect.fail(new FocusSession.NotActive({ sessionId: params.session_id }));
				}

				// 모든 태스크 제거
				yield* sessionTasksService.clearSessionTasks(params.session_id);
			});

		/**
		 * 세션에 태스크를 추가할 수 있는지 확인한다
		 */
		const canAddTaskToSession = (
			params: typeof CanAddTaskToSessionSchema.Type
		): Effect.Effect<
			boolean,
			Supabase.PostgrestError | FocusSession.NotActive | FocusSession.NotFound | Task.NotFound
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isFocusSessionActive(params.session_id);
				if (!isActive) {
					return false;
				}

				// 이미 세션에 있는지 확인
				const alreadyInSession = yield* sessionTasksService.isTaskInSession(params);
				if (alreadyInSession) {
					return false;
				}

				const alreadyCompleted = yield* taskService
					.getTaskById(params.task_id)
					.pipe(Effect.map((task) => task.completed_in_session_id !== null));

				return !alreadyCompleted;
			});

		/**
		 * 세션과 해당 세션에 할당된 태스크들을 함께 조회한다
		 */
		const getSessionWithAssignedTasks = (
			sessionId: string
		): Effect.Effect<
			typeof FocusSessionWithAssignedTasksSchema.Type,
			Supabase.PostgrestError | FocusSession.NotFound | Task.NotFound
		> =>
			Effect.gen(function* () {
				const focusSession = yield* focusSessionsService.getFocusSessionById(sessionId);
				const sessionTasks = yield* sessionTasksService.getTasksBySession(sessionId);
				const tasks = yield* Effect.all(
					sessionTasks.map((sessionTask) => taskService.getTaskById(sessionTask.task_id))
				);

				return {
					...focusSession,
					tasks
				};
			});

		return {
			addTaskToSession,
			removeTaskFromSession,
			addTasksToSession,
			clearSessionTasks,
			canAddTaskToSession,
			getSessionWithAssignedTasks
		};
	})
}) {}
