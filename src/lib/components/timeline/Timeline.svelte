<script lang="ts">
	import FocusSessionCreationDialog from '../dialogs/FocusSessionCreationDialog.svelte';
	import TimelineFocusSessionCard from './TimelineFocusSessionCard.svelte';
	import type { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import { DateTime, Effect } from 'effect';
	import { Separator } from 'bits-ui';
	import { formatTimeKstHHmm, getKstMidnightAsUtc } from '$lib/shared/utils/datetime.svelte';
	import { Circle } from 'lucide-svelte';
	import { currentTime } from '$lib/stores/time';

	/**
	 * 세션 시간 단위. 반올림할 때 사용
	 */
	const QUANTIZED_UNIT_IN_MINUTES = 15;
	/**
	 * 타임라인 시작 시간 (KST 07:00)
	 */
	const TIMELINE_START_HOUR = 7;
	/**
	 * 타임라인 종료 시간 (KST 22:00)
	 */
	const TIMELINE_END_HOUR = 22;
	/**
	 * 타임라인 전체 시간 범위
	 */
	const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

	type Props = {
		focusSessionProjectLookups: Array<typeof FocusSessionProjectLookupSchema.Type>;
	};

	let { focusSessionProjectLookups }: Props = $props();
	let containerElement: HTMLDivElement;

	type TimelineState =
		| {
				type: 'idle';
		  }
		| {
				type: 'select';
				// 처음 선택한 시간대
				anchor: DateTime.Utc;
				// 마우스 트래킹 시간대
				nonAnchor: DateTime.Utc;
		  }
		| {
				type: 'dialog-open';
				start: DateTime.Utc;
				end: DateTime.Utc;
		  };

	let timelineState: TimelineState = $state({
		type: 'idle'
	});

	let interval: [DateTime.Utc, DateTime.Utc] | null = $derived.by(() => {
		if (timelineState.type === 'idle') return null;
		if (timelineState.type === 'select') {
			return [
				DateTime.min(timelineState.anchor, timelineState.nonAnchor),
				DateTime.max(timelineState.anchor, timelineState.nonAnchor)
			];
		}
		if (timelineState.type === 'dialog-open') {
			return [timelineState.start, timelineState.end];
		}
		return null;
	});

	let assignedFocusSessions = $derived(
		focusSessionProjectLookups.toSorted((a, b) => a.start_at.epochMillis - b.start_at.epochMillis)
	);

	// Y 좌표를 시간으로 변환
	// NOTE: 15분 단위로 반올림
	function calculateYToDateTimeUtc(y: number): DateTime.Utc {
		const rect = containerElement.getBoundingClientRect();
		const relativeY = Math.max(0, Math.min(y - rect.top, rect.height));

		// 15시간(07:00-22:00)을 기준으로 비율 계산
		const hourOffset = (relativeY / rect.height) * TIMELINE_HOURS;
		const minuteOffset = hourOffset * 60;

		// 오늘 KST 07:00 기준으로 시간 계산
		const todayMidnight = getKstMidnightAsUtc(DateTime.now.pipe(Effect.runSync));
		const todayStart = DateTime.add(todayMidnight, { hours: TIMELINE_START_HOUR });
		return DateTime.add(todayStart, {
			minutes: Math.floor(minuteOffset / QUANTIZED_UNIT_IN_MINUTES) * QUANTIZED_UNIT_IN_MINUTES
		});
	}

	// 시간을 Y 좌표로 변환
	// NOTE: 15분 단위로 반올림
	function calculateDateTimeUtcToY(time: DateTime.Utc): number {
		if (!containerElement) {
			return 0;
		}

		const rect = containerElement.getBoundingClientRect();
		const todayMidnight = getKstMidnightAsUtc(time);
		const todayStart = DateTime.add(todayMidnight, { hours: TIMELINE_START_HOUR });

		// 07:00으로부터의 분 단위 차이 계산
		const diffMinutes =
			Math.floor(DateTime.distance(todayStart, time) / (1000 * 60 * QUANTIZED_UNIT_IN_MINUTES)) *
			QUANTIZED_UNIT_IN_MINUTES;
		const hours = diffMinutes / 60;

		console.log(`${(hours / TIMELINE_HOURS) * rect.height} px`);

		// 15시간(07:00-22:00) 기준으로 Y 위치 계산
		return (hours / TIMELINE_HOURS) * rect.height;
	}

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
		if (timelineState.type === 'idle') {
			const time = calculateYToDateTimeUtc(e.clientY);
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
		if (timelineState.type === 'select') {
			timelineState.nonAnchor = calculateYToDateTimeUtc(e.clientY);
		}
	}

	/**
	 * 마우스 버튼을 떼었을 때 Dialog 열기
	 * @param e 마우스 이벤트
	 */
	function onmouseup() {
		// 이 경우, timelineState가 'idle'임이 보장
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

	/** 선택 영역 스타일 */
	let selectionStyle = $derived.by(() => {
		// 이 경우, timelineState가 'idle'임이 보장
		if (interval === null) return '';
		const top = calculateDateTimeUtcToY(interval[0]);
		const bottom = calculateDateTimeUtcToY(interval[1]);
		const height = bottom - top;
		return `top: ${top}px; height: ${height}px;`;
	});
</script>

<div class="flex h-full w-full gap-1">
	<!-- 시간 표현 영역 -->
	<div class="flex h-full flex-col justify-between">
		{#each Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => i + TIMELINE_START_HOUR) as hour (hour)}
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
		{#each Array.from({ length: TIMELINE_HOURS + 1 }, (_, i) => i + TIMELINE_START_HOUR) as hour (hour)}
			<div class="flex h-[20px] w-full items-center">
				<Separator.Root class="mx-2 my-1 h-px w-full bg-surface-200-800" />
			</div>
		{/each}

		<!-- 수직 구분선 -->
		<div class="absolute left-3" style:height="calc(100% - 8px)">
			<Separator.Root class="m-1 h-full w-px bg-surface-200-800" orientation="vertical" />
		</div>

		<!-- 현재 시간 인디케이터 -->
		<div
			class="absolute left-2"
			style:width="calc(100% - 8px)"
			style:top="{calculateDateTimeUtcToY(DateTime.unsafeFromDate(currentTime))}px"
		>
			<Separator.Root class="mx-2 my-1 h-[2px] bg-error-500" />
		</div>

		<div
			class="absolute left-2"
			style:top="calc({calculateDateTimeUtcToY(DateTime.unsafeFromDate(currentTime))}px - 3px)"
		>
			<Circle fill="red" size="18" strokeWidth="0" />
		</div>

		<!-- 생성 중인 세션 -->
		{#if timelineState.type !== 'idle' && interval !== null}
			<div
				class="absolute left-4 rounded-sm preset-filled-primary-500"
				style={selectionStyle}
				style:width="calc(100% - 24px)"
			>
				<span class="select-none">
					{formatTimeKstHHmm(interval[0])} ~ {formatTimeKstHHmm(interval[1])}
				</span>
			</div>
		{/if}

		<!-- 생성된 세션 -->
		{#each focusSessionProjectLookups as focusSession (focusSession.id)}
			{@const top = calculateDateTimeUtcToY(focusSession.start_at)}
			{@const bottom = calculateDateTimeUtcToY(focusSession.end_at)}
			<div class="absolute left-4" style:top="{top}px" style:height="{bottom - top}px">
				<TimelineFocusSessionCard {focusSession} />
			</div>
		{/each}
	</div>
</div>

{#if interval !== null}
	<FocusSessionCreationDialog
		open={timelineState.type === 'dialog-open'}
		{interval}
		onOpenChange={(open) => {
			if (open) {
				timelineState.type = 'dialog-open';
			} else {
				timelineState.type = 'idle';
			}
		}}
	/>
{/if}
