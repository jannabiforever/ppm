import { getKstMidnightAsUtc } from '$lib/shared/utils/datetime';
import { DateTime } from 'effect';

// ------------------------------------------------------------
// Timeline app state
// ------------------------------------------------------------

/**
 * A state that tracks along with Timeline application.
 */
export type TimelineState =
	| {
			type: 'idle';
	  }
	| {
			type: 'select';
			/**  time that user first selected */
			anchor: DateTime.Utc;
			/** time that user is currently hovering over */
			nonAnchor: DateTime.Utc;
	  }
	| {
			type: 'dialog-open';
			start: DateTime.Utc;
			end: DateTime.Utc;
	  };

/**
 * By default, the timeline's state is configured as 'idle'.
 */
export const DEFAULT_TIMELINE_STATE: TimelineState = {
	type: 'idle'
};

/**
 * Extracts a time interval from the timeline state.
 *
 * @param state - Timeline state of type 'select' or 'dialog-open'
 * @returns A tuple of start and end times. For 'select' state, the times are automatically sorted
 */
export function getInterval(
	state: Extract<TimelineState, { type: 'select' | 'dialog-open' }>
): [DateTime.Utc, DateTime.Utc];
/**
 * Extracts a time interval from the timeline state.
 *
 * @param state - Timeline state of type 'idle'
 * @returns null
 */
export function getInterval(state: Extract<TimelineState, { type: 'idle' }>): null;
/**
 * Extracts a time interval from the timeline state.
 *
 * @param state - Timeline state
 * @returns A tuple of start and end times, or null if the state is 'idle'
 */
export function getInterval(state: TimelineState): [DateTime.Utc, DateTime.Utc] | null;
export function getInterval(state: TimelineState): [DateTime.Utc, DateTime.Utc] | null {
	if (state.type === 'idle') {
		return null;
	}
	if (state.type === 'select') {
		return [
			DateTime.min(state.anchor, state.nonAnchor),
			DateTime.max(state.anchor, state.nonAnchor)
		];
	}
	if (state.type === 'dialog-open') {
		return [state.start, state.end];
	}
	return null;
}

// ------------------------------------------------------------
// Timeline calculation
// ------------------------------------------------------------

export interface TimelineConfig {
	singleLineHeightInPx: number;
	slotGranularityInMinutes: number;
	startHour: number;
	endHour: number;
}

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
	singleLineHeightInPx: 20,
	slotGranularityInMinutes: 15,
	startHour: 7,
	endHour: 22
};

export interface Rect {
	top: number;
	left: number;
	bottom: number;
	right: number;
}

export class CoordinateCalculator {
	private readonly config: TimelineConfig;
	private readonly viewportTop: number;
	private readonly viewportHeight: number;
	private readonly referenceDate: DateTime.Utc;

	// ------------------------------------------------------------
	// public methods
	// ------------------------------------------------------------

	constructor(
		viewportTop: number,
		viewportHeight: number,
		referenceDate: DateTime.Utc,
		config: TimelineConfig = DEFAULT_TIMELINE_CONFIG
	) {
		this.config = config;
		this.viewportTop = viewportTop;
		this.viewportHeight = viewportHeight;
		this.referenceDate = referenceDate;
	}

	/**
	 * @param y the distance from the top of the viewport in px
	 * @returns the UTC time corresponding to the given y-coordinate. It is rounded to the nearest slot granularity.
	 */
	calculateYToUtc(y: number): DateTime.Utc {
		const minutesFromStart = this.#heightRatio(y) * this.#durationInMinutes();
		const quantized = this.#quantizeMinutes(minutesFromStart);
		return DateTime.add(this.#startOfTimeline(), {
			minutes: quantized
		});
	}

	/**
	 *
	 * @param utc the given DateTime.Utc value
	 * @returns the distance from the top of the viewport in px. It is not rounded to the nearest slot granularity.
	 */
	calculateUtcToY(utc: DateTime.Utc): number {
		// DateTime.distance function returns milliseconds
		const minutesFromStart = DateTime.distance(this.#startOfTimeline(), utc) / (1000 * 60);
		return this.#top() + (minutesFromStart / this.#durationInMinutes()) * this.#height();
	}

	// ------------------------------------------------------------
	// private methods
	// ------------------------------------------------------------

	#durationInMinutes(): number {
		return (this.config.endHour - this.config.startHour) * 60;
	}

	/**
	 *
	 * @param y the distance from the top of the viewport in px
	 * @returns the ratio of the given y-coordinate to the height of the timeline.
	 * For example, if y is the middle of the timeline, the ratio will be 0.5.
	 * if y is the top of the timeline, the ratio will be 0.
	 */
	#heightRatio(y: number): number {
		return (y - this.#top()) / this.#height();
	}

	#top() {
		return this.viewportTop - this.config.singleLineHeightInPx / 2;
	}

	#height() {
		return this.viewportHeight - this.config.singleLineHeightInPx;
	}

	#startOfTheDay(): DateTime.Utc {
		return getKstMidnightAsUtc(this.referenceDate);
	}

	#startOfTimeline(): DateTime.Utc {
		return DateTime.add(this.#startOfTheDay(), {
			hours: this.config.startHour
		});
	}

	#quantizeMinutes(minutes: number): number {
		return (
			Math.round(minutes / this.config.slotGranularityInMinutes) *
			this.config.slotGranularityInMinutes
		);
	}
}
