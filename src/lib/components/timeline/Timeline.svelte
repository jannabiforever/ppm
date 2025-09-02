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
	 * 세션 간 충돌 검사
	 */
	function checkCollision(interval: [DateTime.Utc, DateTime.Utc]): boolean {
		return assignedFocusSessions.some((fs) => {
			return interval[0] >= fs.start_at && interval[1] <= fs.end_at;
		});
	}

	/**
	 * 마우스 클릭 시 위치를 기준으로 timelineState를 'select'로 업데이트
	 * @param e 마우스 이벤트
	 */
	function onmousedown(e: MouseEvent) {
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
	 * 마우스 드래그 시 위치를 기준으로 timelineState.nonAnchor 업데이트
	 * @param e 마우스 이벤트
	 */
	function onmousemove(e: MouseEvent) {
		if (timelineState.type === 'select' && calculator) {
			timelineState.nonAnchor = calculator.calculateYToUtc(e.clientY);
		}
	}

	/**
	 * 마우스 버튼을 떼었을 때 Dialog 열기
	 * @param e 마우스 이벤트
	 */
	function onmouseup() {
		const interval = getInterval(timelineState);
		if (interval !== null) {
			// 충돌 검사
			if (checkCollision(interval) || interval[0] === interval[1]) {
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

	/** 선택 영역 스타일 */
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
	{#if calculator}
		{@const y = calculator.calculateUtcToY(utc)}
		{@const relativeY = y - (containerElement?.getBoundingClientRect().top ?? 0)}
		<div class="absolute left-2" style:width="calc(100% - 8px)" style:top="{relativeY}px">
			<Separator.Root class="mx-2 my-1 h-[2px] bg-error-500" />
		</div>

		<div class="absolute left-2" style:top="{relativeY - 3}px">
			<Circle fill="red" size="18" strokeWidth="0" />
		</div>
	{/if}
{/snippet}

<div class="flex h-full w-full gap-1">
	<!-- 시간 표현 영역 -->
	<div class="flex h-full flex-col justify-between">
		{#each hourRangeArray as hour (hour)}
			<div class="h-[20px] text-end">{hour.toString().padStart(2, '0')}:00</div>
		{/each}
	</div>

	<!-- 상호 작용 영역 -->
	<div
		bind:this={containerElement}
		{onmousedown}
		{onmouseup}
		{onmousemove}
		role="grid"
		tabindex="0"
		class="relative flex h-full flex-1 flex-col justify-between"
	>
		<!-- 수평 시간 구분선 -->
		{#each hourRangeArray as hour (hour)}
			<div class="flex h-[20px] w-full items-center">
				<Separator.Root class="mx-2 my-1 h-px w-full bg-surface-200-800" />
			</div>
		{/each}

		<!-- 수직 구분선 -->
		<div class="absolute left-3" style:height="calc(100% - 8px)">
			<Separator.Root class="m-1 h-full w-px bg-surface-200-800" orientation="vertical" />
		</div>

		<!-- current time indicator -->
		{#if currentTimeHour > timelineConfig.startHour && currentTimeHour < timelineConfig.endHour}
			{@render timeIndicator(currentTime)}
		{/if}

		<!-- 생성 중인 세션 -->
		{#if timelineState.type !== 'idle'}
			<div
				class="absolute left-4 rounded-sm preset-filled-primary-500"
				style={selectionStyle}
				style:width="calc(100% - 24px)"
			>
				<span class="select-none">
					{formatTimeKstHHmm(getInterval(timelineState)[0])} ~ {formatTimeKstHHmm(
						getInterval(timelineState)[1]
					)}
				</span>
			</div>
		{/if}

		<!-- 생성된 세션 -->
		{#each focusSessionProjectLookups as focusSession (focusSession.id)}
			{#if calculator && containerElement}
				{@const startY = calculator.calculateUtcToY(focusSession.start_at)}
				{@const endY = calculator.calculateUtcToY(focusSession.end_at)}
				{@const containerTop = containerElement.getBoundingClientRect().top}
				{@const relativeTop = startY - containerTop}
				{@const height = endY - startY}
				<div class="absolute left-4" style:top="{relativeTop}px" style:height="{height}px">
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
