<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import Select from '../ui/Select.svelte';
	import SessionCard from './SessionCard.svelte';
	import type { FocusSessionProjectLookupSchema } from '$lib/applications/session-project-lookup/types';
	import type { ProjectSchema } from '$lib/modules/projects';
	import { DateTime, Effect } from 'effect';
	import { Hash } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { Separator } from 'bits-ui';
	import { formatTimeKstHHmm, getKstMidnightAsUtc } from '$lib/shared/utils/datetime.svelte';

	/**
	 * 모든 활성 프로젝트 목록 가져오기
	 */
	async function getAllProjects(): Promise<Array<typeof ProjectSchema.Type>> {
		return new Promise((resolve) => {
			// TODO: 구현
			resolve([]);
		});
	}

	/**
	 * 세션 시간 단위. 반올림할 때 사용
	 */
	const QUANTIZED_UNIT_IN_MINUTES = 15;

	interface Props {
		focusSessionProjectLookups: Array<typeof FocusSessionProjectLookupSchema.Type>;
	}

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

		// 24시간을 기준으로 비율 계산
		const hourOffset = (relativeY / rect.height) * 24;
		const minuteOffset = hourOffset * 60;

		// 오늘 KST 자정 기준으로 시간 계산
		const todayMidnight = getKstMidnightAsUtc(DateTime.now.pipe(Effect.runSync));
		return DateTime.add(todayMidnight, {
			minutes: Math.floor(minuteOffset / QUANTIZED_UNIT_IN_MINUTES) * QUANTIZED_UNIT_IN_MINUTES
		});
	}

	// 시간을 Y 좌표로 변환
	// NOTE: 15분 단위로 반올림
	function calculateDateTimeUtcToY(time: DateTime.Utc): number {
		if (!containerElement) return 0;

		const rect = containerElement.getBoundingClientRect();
		const todayMidnight = getKstMidnightAsUtc(time);

		// 자정으로부터의 분 단위 차이 계산
		const diffMinutes =
			Math.floor(DateTime.distance(todayMidnight, time) / (1000 * 60 * QUANTIZED_UNIT_IN_MINUTES)) *
			QUANTIZED_UNIT_IN_MINUTES;
		const hours = diffMinutes / 60;

		// 24시간 기준으로 Y 위치 계산
		return (hours / 24) * rect.height;
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

{#snippet singleTimeLine(hour: number)}
	<div class="flex h-[calc(100%/25)] flex-row items-start justify-between">
		<span class="min-w-[45px] text-right text-sm text-surface-500">
			{`${hour.toString().padStart(2, '0')}:00`}
		</span>
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
	{#each Array(25).keys() as hour (hour)}
		{@render singleTimeLine(hour)}
	{/each}

	{#each assignedFocusSessions as fs (fs.id)}
		{@const top = calculateDateTimeUtcToY(fs.start_at)}
		{@const height = calculateDateTimeUtcToY(fs.end_at) - top}
		<div class="absolute right-4 left-16" style="top: {top}px; height: {height}px;">
			<SessionCard focusSession={fs} />
		</div>
	{/each}

	{#if timelineState.type !== 'idle' && interval !== null}
		<div
			class="pointer-events-none absolute right-4 left-16 z-10 rounded-lg border-2 border-primary-500 bg-surface-50-950"
			class:border-error-500={checkCollision(interval)}
			style={selectionStyle}
		>
			<div class="p-2 text-sm font-medium text-primary-700">
				{formatTimeKstHHmm(interval[0])} ~ {formatTimeKstHHmm(interval[1])}
			</div>
		</div>
	{/if}
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
	{#snippet content()}
		{#if interval !== null}
			<form method="POST" action="/api/focus-sessions" class="flex w-full flex-col gap-3 pt-3">
				<input type="hidden" name="start_at" value={DateTime.formatIso(interval[0])} />
				<input type="hidden" name="end_at" value={DateTime.formatIso(interval[1])} />
				{#await getAllProjects() then projects}
					{@const projectsIncludingInbox = projects
						.map((p) => ({ label: p.name, value: p.id }))
						.concat([{ label: '수집함', value: 'inbox' }])}
					<Select ariaLabel="프로젝트 선택" items={projectsIncludingInbox}>
						{#snippet trigger({ selectedValue })}
							<Hash {...ICON_PROPS.md} class="text-surface-300-700" />
							<span class="ml-3 flex-1 text-start text-sm text-surface-300-700">
								{selectedValue
									? projects.find((p) => p.id === selectedValue)?.name
									: '프로젝트 선택'}
							</span>
						{/snippet}
					</Select>
				{/await}

				<Button filled type="submit">생성</Button>
			</form>
		{/if}
	{/snippet}
</Dialog>
