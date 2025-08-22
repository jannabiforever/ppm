import { Effect } from 'effect';
import * as Option from 'effect/Option';
import * as FocusSession from '$lib/modules/focus_sessions';
import * as SessionTask from '$lib/modules/session_tasks';
import * as Task from '$lib/modules/tasks';
import * as Supabase from '$lib/modules/supabase';
import { TaskAlreadyInSessionError, TaskNotInSessionError } from '$lib/modules/session_tasks';
import { SessionNotActiveError } from './errors';
import type {
	AddTaskToSessionParams,
	RemoveTaskFromSessionParams,
	AddTasksToSessionParams,
	ClearSessionTasksParams,
	CanAddTaskToSessionParams
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
			params: AddTaskToSessionParams
		): Effect.Effect<void, SessionNotActiveError | TaskAlreadyInSessionError | Error> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isSessionActive(params.session_id);
				if (Option.isNone(isActive) || !isActive.value) {
					return yield* Effect.fail(new SessionNotActiveError({ session_id: params.session_id }));
				}

				// 이미 추가되어 있는지 확인
				const existing = yield* sessionTasksService.getSessionTask(params);
				if (Option.isSome(existing)) {
					return yield* Effect.fail(
						new TaskAlreadyInSessionError({
							task_id: params.task_id,
							session_id: params.session_id
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
			params: RemoveTaskFromSessionParams
		): Effect.Effect<
			void,
			SessionNotActiveError | TaskNotInSessionError | Supabase.PostgrestError
		> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isSessionActive(params.session_id);
				if (Option.isNone(isActive) || !isActive.value) {
					return yield* Effect.fail(new SessionNotActiveError({ session_id: params.session_id }));
				}

				// 존재하는지 확인
				const existing = yield* sessionTasksService.getSessionTask(params);
				if (Option.isNone(existing)) {
					return yield* Effect.fail(
						new TaskNotInSessionError({
							task_id: params.task_id,
							session_id: params.session_id
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
			params: AddTasksToSessionParams
		): Effect.Effect<void, SessionNotActiveError | Supabase.PostgrestError> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isSessionActive(params.session_id);
				if (Option.isNone(isActive) || !isActive.value) {
					return yield* Effect.fail(new SessionNotActiveError({ session_id: params.session_id }));
				}

				// 태스크들 추가
				yield* sessionTasksService.addTasksToSession(params);
			});

		/**
		 * 활성 세션의 모든 태스크를 제거한다
		 */
		const clearSessionTasks = (
			params: ClearSessionTasksParams
		): Effect.Effect<void, SessionNotActiveError | Error> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isSessionActive(params.session_id);
				if (Option.isNone(isActive) || !isActive.value) {
					return yield* Effect.fail(new SessionNotActiveError({ session_id: params.session_id }));
				}

				// 모든 태스크 제거
				yield* sessionTasksService.clearSessionTasks(params.session_id);
			});

		/**
		 * 세션에 태스크를 추가할 수 있는지 확인한다
		 */
		const canAddTaskToSession = (
			params: CanAddTaskToSessionParams
		): Effect.Effect<boolean, Error> =>
			Effect.gen(function* () {
				// 세션이 활성 상태인지 확인
				const isActive = yield* focusSessionsService.isSessionActive(params.session_id);
				if (Option.isNone(isActive) || !isActive.value) {
					return false;
				}

				// 이미 세션에 있는지 확인
				const alreadyInSession = yield* sessionTasksService.isTaskInSession(params);
				if (alreadyInSession) {
					return false;
				}

				const alreadyCompleted = yield* taskService
					.getTaskById(params.task_id)
					.pipe(
						Effect.map((task) => Option.isSome(task) && task.value.completed_in_session_id !== null)
					);

				return !alreadyCompleted;
			});

		return {
			addTaskToSession,
			removeTaskFromSession,
			addTasksToSession,
			clearSessionTasks,
			canAddTaskToSession
		};
	})
}) {}
