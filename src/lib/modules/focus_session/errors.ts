import { Data } from 'effect';

/**
 * Focus session related domain errors
 */
export class ActiveFocusSessionExistsError extends Data.TaggedError('ActiveFocusSessionExists')<{
	readonly message: string;
}> {
	constructor() {
		super({
			message:
				'An active focus session already exists. Please end the current session before starting a new one.'
		});
	}
}

export class FocusSessionNotFoundError extends Data.TaggedError('FocusSessionNotFound')<{
	readonly message: string;
	readonly sessionId?: string;
}> {
	constructor(sessionId: string) {
		super({
			message: `Focus session with ID ${sessionId} not found.`,
			sessionId
		});
	}
}

export class FocusSessionAlreadyEndedError extends Data.TaggedError('FocusSessionAlreadyEnded')<{
	readonly message: string;
	readonly sessionId?: string;
}> {
	constructor(sessionId: string) {
		super({
			message: `Focus session with ID ${sessionId} has already ended.`,
			sessionId
		});
	}
}
