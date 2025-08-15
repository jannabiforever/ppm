import type { Transport, Transporter } from '@sveltejs/kit';
import { Option } from 'effect';
import {
	TaskNotFoundError,
	InvalidTaskStatusTransitionError,
	TaskInSessionError,
	ActiveFocusSessionExistsError,
	FocusSessionNotFoundError,
	FocusSessionAlreadyEndedError,
	ProjectNotFoundError,
	ProjectHasTasksError,
	UserProfileNotFoundError
} from '$lib/shared/errors';

const optionTransporter: Transporter = {
	encode: (data) => {
		// Option이 아니면 처리하지 않음
		if (!Option.isOption(data)) return false;

		// Option을 직렬화 가능한 형태로 변환
		return Option.match(data, {
			onSome: (value) => ({ _tag: 'Some', value }),
			onNone: () => ({ _tag: 'None' })
		});
	},
	decode: (data) => {
		// 직렬화된 Option을 다시 Option으로 복원
		if (!data || typeof data !== 'object') return Option.none();

		if (data._tag === 'Some') return Option.some(data.value);
		return Option.none();
	}
};

const domainErrorTransporter: Transporter = {
	encode: (data) => {
		// DomainError가 아니면 처리하지 않음
		if (!data || typeof data !== 'object' || !('_tag' in data) || !('message' in data)) {
			return false;
		}

		// _tag 기반으로 도메인 에러인지 확인
		const validTags = [
			'TaskNotFound',
			'InvalidTaskStatusTransition',
			'TaskInSession',
			'ActiveFocusSessionExists',
			'FocusSessionNotFound',
			'FocusSessionAlreadyEnded',
			'ProjectNotFound',
			'ProjectHasTasks',
			'UserProfileNotFound'
		];

		if (!validTags.includes(data._tag as string)) {
			return false;
		}

		// 에러 객체를 직렬화 가능한 형태로 변환
		return {
			_tag: data._tag,
			message: data.message,
			...data // 추가 속성들 포함
		};
	},
	decode: (data) => {
		// 직렬화된 에러를 다시 에러 인스턴스로 복원
		if (!data || typeof data !== 'object' || !data._tag || !data.message) {
			return null;
		}

		// _tag에 따라 적절한 에러 클래스 인스턴스 생성
		switch (data._tag) {
			case 'TaskNotFound':
				return new TaskNotFoundError(data.taskId || '');
			case 'InvalidTaskStatusTransition':
				return new InvalidTaskStatusTransitionError(
					data.currentStatus || '',
					data.targetStatus || ''
				);
			case 'TaskInSession':
				return new TaskInSessionError(data.taskId || '');
			case 'ActiveFocusSessionExists':
				return new ActiveFocusSessionExistsError();
			case 'FocusSessionNotFound':
				return new FocusSessionNotFoundError(data.sessionId || '');
			case 'FocusSessionAlreadyEnded':
				return new FocusSessionAlreadyEndedError(data.sessionId || '');
			case 'ProjectNotFound':
				return new ProjectNotFoundError(data.projectId || '');
			case 'ProjectHasTasks':
				return new ProjectHasTasksError(data.taskCount || 0);
			case 'UserProfileNotFound':
				return new UserProfileNotFoundError(data.userId || '');
			default:
				return null;
		}
	}
};

export const transport: Transport = {
	Option: optionTransporter,
	DomainError: domainErrorTransporter
};
