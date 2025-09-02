<script lang="ts">
	import FocusSessionCreationDialog from '../dialogs/FocusSessionCreationDialog.svelte';
	import TimelineFocusSessionCard from './TimelineFocusSessionCard.svelte';
	import type { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import { DateTime, Effect } from 'effect';
	import { Separator } from 'bits-ui';
	import { formatTimeKstHHmm, getKstZoned } from '$lib/shared/utils/datetime';
	import { Circle } from 'lucide-svelte';
	import {
		CoordinateCalculator,
		DEFAULT_TIMELINE_CONFIG,
		DEFAULT_TIMELINE_STATE,
		getInterval,
		type TimelineConfig,
		type TimelineState
	} from './timeline';

	type Props = {
		focusSessionProjectLookups: Array<typeof FocusSessionProjectLookupSchema.Type>;
		timelineConfig?: TimelineConfig;
	};

	let { focusSessionProjectLookups, timelineConfig = DEFAULT_TIMELINE_CONFIG }: Props = $props();
	let assignedFocusSessions = $derived(
		focusSessionProjectLookups.toSorted((a, b) => a.start_at.epochMillis - b.start_at.epochMillis)
	);

	/** undefined while not mounted */
	let containerElement: HTMLDivElement | undefined = $state(undefined);
	let calculator = $derived.by(() => {
		if (typeof window === 'undefined' || !containerElement) return undefined;
		const rect = containerElement.getBoundingClientRect();
		return new CoordinateCalculator(rect.top, rect.height, currentTime, timelineConfig);
	});
	let timelineState: TimelineState = $state(DEFAULT_TIMELINE_STATE);

	/**
	 * Current time in DateTime.Utc format.
	 * Updates every 5 minutes.
	 */
	let currentTime = $state(DateTime.now.pipe(Effect.runSync));
	let currentTimeHour = $derived.by(() => {
		const zoned = getKstZoned(currentTime);
		return DateTime.getPart(zoned, 'hours');
	});
	setTimeout(
		() => {
			currentTime = DateTime.now.pipe(Effect.runSync);
		},
		1000 * 60 * 5
	);

	/**
	 * Array that holds numbers from startHour to endHour.
	 */
	const hourRangeArray = $derived(
		Array.from(
			{ length: timelineConfig.endHour - timelineConfig.startHour + 1 },
			(_, i) => i + timelineConfig.startHour
		)
	);

	/**
	 * Check for session conflicts
	 */
	function checkCollision(interval: [DateTime.Utc, DateTime.Utc]): boolean {
		return assignedFocusSessions.some((fs) => {
			return interval[0] >= fs.start_at && interval[1] <= fs.end_at;
		});
	}

	/**
	 * Update timelineState to 'select' based on mouse click position.
	 * Cancels selection if right click is pressed.
	 * @param e Mouse event
	 */
	function onmousedown(e: MouseEvent) {
		// right click while select would cancel selection
		if (timelineState.type === 'select' && e.button === 2) {
			e.preventDefault();
			timelineState = { type: 'idle' };
			return;
		}

		if (timelineState.type === 'idle' && calculator) {
			const time = calculator.calculateYToUtc(e.clientY);
			timelineState = {
				type: 'select',
				anchor: time,
				nonAnchor: time
			};
		}
	}

	/**
	 * Update timelineState.nonAnchor based on mouse drag position
	 * @param e Mouse event
	 */
	function onmousemove(e: MouseEvent) {
		if (timelineState.type === 'select' && calculator) {
			e.preventDefault();
			timelineState.nonAnchor = calculator.calculateYToUtc(e.clientY);
		}
	}

	/**
	 * Open Dialog when mouse button is released
	 * @param e Mouse event
	 */
	function onmouseup(e: MouseEvent) {
		e.preventDefault();
		const interval = getInterval(timelineState);
		if (interval !== null) {
			// 충돌 검사
			if (checkCollision(interval)) {
				timelineState = { type: 'idle' };
				return;
			}

			timelineState = {
				type: 'dialog-open',
				start: interval[0],
				end: interval[1]
			};
		}
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && timelineState.type === 'select') {
			timelineState = { type: 'idle' };
		}
	}

	/** Creating focus session style */
	let selectionStyle = $derived.by(() => {
		const interval = getInterval(timelineState);
		if (interval === null || !calculator) return '';

		const startY = calculator.calculateUtcToY(interval[0]);
		const endY = calculator.calculateUtcToY(interval[1]);
		const containerTop = containerElement?.getBoundingClientRect().top ?? 0;
		const relativeTop = startY - containerTop;
		const height = endY - startY;

		return `top: ${relativeTop}px; height: ${height}px;`;
	});
</script>

{#snippet timeIndicator(utc: DateTime.Utc)}
	{#if calculator !== undefined && containerElement !== undefined}
		{@const y = calculator.calculateUtcToY(utc)}
		{@const seperatorMargin = 8}
		{@const relativeY = y - containerElement.getBoundingClientRect().top - seperatorMargin}
		<div class="absolute left-2 z-50" style:width="calc(100% - 8px)" style:top="{relativeY}px">
			<Separator.Root class="mx-2 my-1 h-[2px] bg-error-500" />
		</div>

		<div class="absolute left-2 z-50" style:top="{relativeY - 3}px">
			<Circle fill="red" size="18" strokeWidth="0" />
		</div>
	{/if}
{/snippet}

<div class="flex h-full w-full gap-1">
	<!-- Time label area -->
	<div class="flex h-full flex-col justify-between">
		{#each hourRangeArray as hour (hour)}
			<div class="h-[20px] text-end text-xs select-none">
				{hour.toString().padStart(2, '0')}:00
			</div>
		{/each}
	</div>

	<!-- Interaction Area -->
	<div
		bind:this={containerElement}
		{onmousedown}
		{onmouseup}
		{onmousemove}
		{onkeydown}
		role="grid"
		tabindex="0"
		class="relative flex h-full flex-1 flex-col justify-between select-none"
	>
		<!-- Horizontal Separator -->
		{#each hourRangeArray as hour (hour)}
			<div class="flex h-[20px] w-full items-center">
				<Separator.Root class="mx-2 my-1 h-px w-full bg-surface-200-800" />
			</div>
		{/each}

		<!-- Vertical Separator -->
		<div class="absolute left-3" style:height="calc(100% - 8px)">
			<Separator.Root class="m-1 h-full w-px bg-surface-200-800" orientation="vertical" />
		</div>

		<!-- current time indicator -->
		{#if currentTimeHour > timelineConfig.startHour && currentTimeHour < timelineConfig.endHour}
			{@render timeIndicator(currentTime)}
		{/if}

		<!-- Session Creating -->
		{#if timelineState.type !== 'idle'}
			<div
				class="absolute right-4 left-8 rounded-sm border-[2px] border-primary-500 bg-surface-50-950"
				style={selectionStyle}
			>
				<span class="mx-3 text-xs select-none">
					{formatTimeKstHHmm(getInterval(timelineState)[0])} ~ {formatTimeKstHHmm(
						getInterval(timelineState)[1]
					)}
				</span>
			</div>
		{/if}

		<!-- Session Created -->
		{#each focusSessionProjectLookups as focusSession (focusSession.id)}
			{#if calculator && containerElement}
				{@const startY = calculator.calculateUtcToY(focusSession.start_at)}
				{@const endY = calculator.calculateUtcToY(focusSession.end_at)}
				{@const containerTop = containerElement.getBoundingClientRect().top}
				{@const containerBottom = containerElement.getBoundingClientRect().bottom}
				<div
					class="absolute right-4 left-8"
					style:top="{startY - containerTop}px"
					style:bottom="{containerBottom - endY}px"
				>
					<TimelineFocusSessionCard {focusSession} />
				</div>
			{/if}
		{/each}
	</div>
</div>

{#if timelineState.type === 'dialog-open'}
	<FocusSessionCreationDialog
		open={timelineState.type === 'dialog-open'}
		interval={getInterval(timelineState)}
		onOpenChange={(open) => {
			if (open) {
				timelineState.type = 'dialog-open';
			} else {
				timelineState.type = 'idle';
			}
		}}
	/>
{/if}
