import * as S from 'effect/Schema';

// 세션에 태스크 추가 시 사용하는 파라미터
export const AddTaskToSessionParams = S.Struct({
	session_id: S.String,
	task_id: S.String
});
export type AddTaskToSessionParams = S.Schema.Type<typeof AddTaskToSessionParams>;

// 세션에서 태스크 제거 시 사용하는 파라미터
export const RemoveTaskFromSessionParams = S.Struct({
	session_id: S.String,
	task_id: S.String
});
export type RemoveTaskFromSessionParams = S.Schema.Type<typeof RemoveTaskFromSessionParams>;

// 세션에 여러 태스크 추가 시 사용하는 파라미터
export const AddTasksToSessionParams = S.Struct({
	session_id: S.String,
	task_ids: S.Array(S.String)
});
export type AddTasksToSessionParams = S.Schema.Type<typeof AddTasksToSessionParams>;

// 세션의 모든 태스크 제거 시 사용하는 파라미터
export const ClearSessionTasksParams = S.Struct({
	session_id: S.String
});
export type ClearSessionTasksParams = S.Schema.Type<typeof ClearSessionTasksParams>;

// 세션에 태스크 추가 가능 여부 확인 시 사용하는 파라미터
export const CanAddTaskToSessionParams = S.Struct({
	session_id: S.String,
	task_id: S.String
});
export type CanAddTaskToSessionParams = S.Schema.Type<typeof CanAddTaskToSessionParams>;
