// import { Effect } from 'effect';
// import * as Layer from 'effect/Layer';
// import * as Option from 'effect/Option';
// import type { LayoutServerLoad } from './$types';

// import * as FocusSession from '$lib/modules/focus_sessions';
// import * as Project from '$lib/modules/projects';
// import * as Task from '$lib/modules/tasks';

// /**
//  * 네비게이션에는 다음 데이터가 필요함:
//  * - 유저와 프로필 정보
//  * - 현재 진행 중인 세션 (존재하는 경우에만)
//  * - 현재 active 상태의 프로젝트들
//  */
// export const load: LayoutServerLoad = async ({ locals }) => {
// 	const activeProjectsAsync = Effect.gen(function* () {
// 		const project = yield* Project.Service;
// 		return yield* project.getActiveProjects();
// 	}).pipe(Effect.provide(Layer.provide(Project.Service.Default, locals.supabase)));

// 	const currentFocusSessionAsync = Effect.gen(function* () {
// 		const sessionRepository = yield* FocusSession.Service;
// 		const activeSession = yield* sessionRepository.getActiveSession();
// 		if (Option.isSome(activeSession)) {
// 			const session = activeSession.value;
// 			const taskRepository = yield* Task.Service;
//       const tasks = yield* taskRepository.getTasks({});
// 			return { session, task };
// 		}
// 	}).pipe(
// 		Effect.provide(FocusSession.Service.Default),
// 		Effect.provide(Task.Service.Default),
// 		Effect.provide(locals.supabase)
// 	);

// 	const res = await Effect.all([activeProjectsAsync, currentFocusSessionAsync]).pipe(
// 		Effect.either,
// 		Effect.runPromise
// 	);

// 	if (res._tag === 'Left') {
// 		return error(res.left.status, res.left);
// 	}

// 	return {
// 		userProfile: locals.userAndProfile,
// 		activeProjects: res.right[0],
// 		currentFocusSession: res.right[1]
// 	};
// };
