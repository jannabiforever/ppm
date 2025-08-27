<script lang="ts">
	import { Separator } from 'bits-ui';
	import { DateTime, Effect } from 'effect';
	import SessionCard from './SessionCard.svelte';
	import type { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import Dialog from '../ui/Dialog.svelte';
	import { getKstMidnightAsUtc } from '$lib/shared/utils/datetime.svelte';

	interface Props {
		focusSessions: Array<typeof FocusSessionProjectLookupSchema.Type>;
	}

	let { focusSessions }: Props = $props();
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
		focusSessions.toSorted((a, b) => a.start_at.epochMillis - b.start_at.epochMillis)
	);

	// Y 좌표를 시간으로 변환
	function calculateYToDateTimeUtc(y: number): DateTime.Utc {
		const rect = containerElement.getBoundingClientRect();
		const relativeY = Math.max(0, Math.min(y - rect.top, rect.height));

		// 24시간을 기준으로 비율 계산
		const hourOffset = (relativeY / rect.height) * 24;
		const minuteOffset = hourOffset * 60;

		// 오늘 KST 자정 기준으로 시간 계산
		const todayMidnight = getKstMidnightAsUtc(DateTime.now.pipe(Effect.runSync));
		return DateTime.add(todayMidnight, { minutes: Math.floor(minuteOffset) });
	}

	// 시간을 Y 좌표로 변환
	function calculateDateTimeUtcToY(time: DateTime.Utc): number {
		if (!containerElement) return 0;

		const rect = containerElement.getBoundingClientRect();
		const todayMidnight = getKstMidnightAsUtc(time);

		// 자정으로부터의 분 단위 차이 계산
		const diffMinutes = DateTime.distance(todayMidnight, time) / (1000 * 60);
		const hours = diffMinutes / 60;

		// 24시간 기준으로 Y 위치 계산
		return (hours / 24) * rect.height;
	}

	// 세션 간 충돌 검사
	function checkCollision(interval: [DateTime.Utc, DateTime.Utc]): boolean {
		return assignedFocusSessions.some((fs) => {
			return interval[0] >= fs.start_at && interval[1] <= fs.end_at;
		});
	}

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

	function onmousemove(e: MouseEvent) {
		if (timelineState.type === 'select') {
			timelineState.nonAnchor = calculateYToDateTimeUtc(e.clientY);
		}
	}

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

	// 선택 영역 스타일 계산
	let selectionStyle = $derived.by(() => {
		// 이 경우, timelineState가 'idle'임이 보장
		if (interval === null) return '';
		const top = calculateDateTimeUtcToY(interval[0]);
		const bottom = calculateDateTimeUtcToY(interval[1]);
		const height = bottom - top;
		return `top: ${top}px; height: ${height}px;`;
	});

	// 시간 포맷팅 헬퍼: KST TZ에서 HH:mm 꼴로.
	function formatTimeKst(time: DateTime.Utc): string {
		return DateTime.formatIntl(
			time,
			new Intl.DateTimeFormat('ko-KR', {
				timeZone: 'Asia/Seoul',
				hour: '2-digit',
				minute: '2-digit',
				hour12: false
			})
		);
	}
</script>

{#snippet singleTimeLine(label: string)}
	<div class="flex h-[calc(100%/25)] flex-row items-start justify-between">
		<span class="min-w-[45px] text-right text-sm text-surface-500">{label}</span>
		<Separator.Root class="mr-2 ml-5 h-px flex-1 bg-surface-300" />
	</div>
{/snippet}

<div
	bind:this={containerElement}
	class="relative flex h-full w-full flex-col justify-center px-2 select-none"
	{onmousedown}
	{onmousemove}
	{onmouseup}
	role="grid"
	tabindex="0"
>
	{#each Array(25)
		.keys()
		.map((index) => index.toString()) as hour (hour)}
		{@render singleTimeLine(`${hour.padStart(2, '0')}:00`)}
	{/each}

	<!-- 선택 영역 -->
	{#if timelineState.type !== 'idle' && interval !== null}
		<div
			class="pointer-events-none absolute right-4 left-16 z-10 rounded-lg border-2 border-primary-500 bg-surface-50-950"
			style={selectionStyle}
		>
			<div class="p-2 text-sm font-medium text-primary-700">
				{formatTimeKst(interval[0])} ~ {formatTimeKst(interval[1])}
			</div>
		</div>
	{/if}

	<div class="relative w-full">
		<!-- 세션 카드들 -->
		{#each assignedFocusSessions as fs (fs.id)}
			{@const top = calculateDateTimeUtcToY(fs.start_at)}
			{@const height = calculateDateTimeUtcToY(fs.end_at) - top}
			<div class="absolute right-4 left-16" style="top: {top}px; height: {height}px;">
				<SessionCard focusSession={fs} />
			</div>
		{/each}
	</div>
</div>

<Dialog
	title="집중 세션 생성하기"
	open={timelineState.type === 'dialog-open'}
	onOpenChange={(open) => {
		if (!open) {
			timelineState = { type: 'idle' };
		}
	}}
>
	{#snippet content()}{/snippet}
</Dialog>
