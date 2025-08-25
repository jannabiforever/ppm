import { FocusSessionSchema } from '$lib/modules/focus_sessions';
import { TaskSchema } from '$lib/modules/tasks';
import * as S from 'effect/Schema';

// 세션에 태스크 추가 시 사용하는 파라미터
export const AddTaskToSessionSchema = S.Struct({
	session_id: S.String,
	task_id: S.String
});

// 세션에서 태스크 제거 시 사용하는 파라미터
export const RemoveTaskFromSessionSchema = S.Struct({
	session_id: S.String,
	task_id: S.String
});

// 세션에 여러 태스크 추가 시 사용하는 파라미터
export const AddTasksToSessionSchema = S.Struct({
	session_id: S.String,
	task_ids: S.Array(S.String)
});

// 세션의 모든 태스크 제거 시 사용하는 파라미터
export const ClearSessionTasksSchema = S.Struct({
	session_id: S.String
});

// 세션에 태스크 추가 가능 여부 확인 시 사용하는 파라미터
export const CanAddTaskToSessionSchema = S.Struct({
	session_id: S.String,
	task_id: S.String
});

export const FocusSessionWithAssignedTasksSchema = S.extend(
	FocusSessionSchema,
	S.Struct({
		tasks: S.Array(TaskSchema)
	})
);
