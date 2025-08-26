<script lang="ts">
	import { Separator } from 'bits-ui';
	import { DateTime, Effect } from 'effect';
	import SessionCard from './SessionCard.svelte';
	import type { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import Dialog from '../ui/Dialog.svelte';

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
				start: DateTime.Utc;
				end: DateTime.Utc;
		  }
		| {
				type: 'dialog-open';
				start: DateTime.Utc;
				end: DateTime.Utc;
		  };

	let timelineState: TimelineState = $state({
		type: 'idle'
	});

	let assignedFocusSessions = $derived(
		focusSessions.toSorted((a, b) => a.start_at.epochMillis - b.start_at.epochMillis)
	);

	// KST 자정 시간을 가져옴
	function getKstMidnight(date: DateTime.Utc): DateTime.Utc {
		// KST로 변환 후 시간을 00:00:00으로 설정
		const kstDate = DateTime.unsafeMakeZoned(date, { timeZone: DateTime.zoneMakeLocal() });
		const midnight = DateTime.startOf(kstDate, 'day');
		return DateTime.toUtc(midnight);
	}

	// Y 좌표를 시간으로 변환
	function calculateYToDateTimeUtc(y: number): DateTime.Utc {
		if (!containerElement) throw new Error('Container element not found');

		const rect = containerElement.getBoundingClientRect();
		const relativeY = Math.max(0, Math.min(y - rect.top, rect.height));

		// 24시간을 기준으로 비율 계산
		const hourOffset = (relativeY / rect.height) * 24;
		const minuteOffset = hourOffset * 60;

		// 오늘 KST 자정 기준으로 시간 계산
		const todayMidnight = getKstMidnight(DateTime.now.pipe(Effect.runSync));
		return DateTime.add(todayMidnight, { minutes: Math.floor(minuteOffset) });
	}

	// 시간을 Y 좌표로 변환
	function calculateDateTimeUtcToY(time: DateTime.Utc): number {
		if (!containerElement) return 0;

		const rect = containerElement.getBoundingClientRect();
		const todayMidnight = getKstMidnight(time);

		// 자정으로부터의 분 단위 차이 계산
		const diffMinutes = DateTime.distance(time, todayMidnight) / 1000;
		const hours = diffMinutes / 60;

		// 24시간 기준으로 Y 위치 계산
		return (hours / 24) * rect.height;
	}

	// 세션 간 충돌 검사
	function checkCollision(start: DateTime.Utc, end: DateTime.Utc): boolean {
		return assignedFocusSessions.some((session) => {
			const sessionStart = session.start_at;
			const sessionEnd = session.end_at;

			// 시간이 겹치는지 확인
			return DateTime.lessThan(start, sessionEnd) && DateTime.greaterThan(end, sessionStart);
		});
	}

	function onmousedown(e: MouseEvent) {
		console.log('onmousedown', e.clientY);

		if (timelineState.type === 'idle') {
			const time = calculateYToDateTimeUtc(e.clientY);
			timelineState = {
				type: 'select',
				start: time,
				end: time
			};
		}
	}

	function onmousemove(e: MouseEvent) {
		if (timelineState.type === 'select') {
			const newEnd = calculateYToDateTimeUtc(e.clientY);
			const start = DateTime.min(timelineState.start, newEnd);
			const end = DateTime.max(timelineState.start, newEnd);

			timelineState = {
				type: 'select',
				start,
				end
			};
		}
	}

	function onmouseup() {
		console.log('onmouseup', JSON.stringify(timelineState));

		if (timelineState.type === 'select') {
			// 최소 15분 이상 선택했는지 확인
			const durationMinutes = DateTime.distance(timelineState.end, timelineState.start) / 1000;
			if (durationMinutes < 15) {
				timelineState = { type: 'idle' };
				return;
			}

			// 충돌 검사
			if (checkCollision(timelineState.start, timelineState.end)) {
				console.log('세션 충돌 발생:', {
					start: DateTime.formatIso(timelineState.start),
					end: DateTime.formatIso(timelineState.end)
				});
				timelineState = { type: 'idle' };
				return;
			}

			timelineState = {
				type: 'dialog-open',
				start: timelineState.start,
				end: timelineState.end
			};
		}
	}

	// 선택 영역 스타일 계산
	let selectionStyle = $derived.by(() => {
		if (timelineState.type !== 'select' || !containerElement) return '';

		const top = calculateDateTimeUtcToY(timelineState.start);
		const bottom = calculateDateTimeUtcToY(timelineState.end);
		const height = bottom - top;

		return `top: ${top}px; height: ${height}px;`;
	});

	// 시간 포맷팅 헬퍼
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
	<div class="flex h-[calc(100%/25)] flex-row items-center justify-between">
		<Separator.Root class="mr-2 -ml-5 block h-px flex-1 bg-surface-300" />
		<span class="min-w-[45px] text-right text-sm text-surface-500">{label}</span>
	</div>
{/snippet}

<div
	bind:this={containerElement}
	class="relative flex h-full w-full flex-col justify-center px-5 select-none"
	{onmousedown}
	{onmousemove}
	{onmouseup}
	role="grid"
	tabindex="0"
>
	{#each Array(25)
		.keys()
		.map((index) => index.toString()) as hour (hour)}
		{@render singleTimeLine(`${hour.toString().padStart(2, '0')}:00`)}
	{/each}

	<!-- 선택 영역 -->
	{#if timelineState.type === 'select'}
		<div
			class="bg-opacity-30 pointer-events-none absolute right-4 left-4 z-10 rounded-lg border-2 border-primary-500 bg-primary-500"
			style={selectionStyle}
		>
			<div class="absolute top-2 left-3 text-sm font-medium text-primary-700">
				{formatTimeKst(timelineState.start)} ~ {formatTimeKst(timelineState.end)}
			</div>
		</div>
	{/if}

	<!-- 세션 카드들 -->
	{#each assignedFocusSessions as fs (fs.id)}
		{@const top = calculateDateTimeUtcToY(fs.start_at)}
		{@const height = calculateDateTimeUtcToY(fs.end_at) - top}
		<div class="absolute right-4 left-4" style="top: {top}px; height: {height}px;">
			<SessionCard focusSession={fs} />
		</div>
	{/each}
</div>

<Dialog
	title="세션 생성하기"
	open={timelineState.type === 'dialog-open'}
	onOpenChange={(open) => {
		if (!open) {
			timelineState = { type: 'idle' };
		}
	}}
>
	{#snippet content()}{/snippet}
</Dialog>
