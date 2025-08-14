<script lang="ts">
	import type { FocusSessionWithTasks } from '$lib/modules';
	import { AlarmClock } from 'lucide-svelte';
	import { DEFAULT_ICON_PROPS } from '../constants';
	import NavItemSeparator from './NavItemSeparator.svelte';
	import { currentTime } from '$lib/infra/time.svelte';
	import Checkbox from '../ui/Checkbox.svelte';

	interface Props {
		currentFocusSessionWithTasks: FocusSessionWithTasks;
	}

	let { currentFocusSessionWithTasks }: Props = $props();

	let remainingTimeInSeconds = $derived(
		Date.parse(currentFocusSessionWithTasks.scheduled_end_at) - currentTime.getTime()
	);

	/**
	 * remaining time in {hh}h {mm}m format.
	 * ex) 1h 30m
	 */
	let remainingTimeInHHMM = $derived.by(() => {
		const hours = Math.floor(remainingTimeInSeconds / 3600);
		const minutes = Math.floor((remainingTimeInSeconds % 3600) / 60);
		return `${hours.toString()}h ${minutes.toString().padStart(2, '0')}m`;
	});
</script>

<div class="flex w-full flex-col gap-2 rounded-sm border border-surface-200-800 p-4">
	<div class="flex items-center gap-2.5">
		<AlarmClock {...DEFAULT_ICON_PROPS.md} />
		<span class="text-semibold">현재 세션</span>
	</div>
	<NavItemSeparator />
	<div class="flex w-full flex-col">
		<span class="text-semibold">{currentFocusSessionWithTasks.project_id ?? '무제'}</span>
		<div class="flex items-center gap-3 py-2">
			<span class="text-[24px] font-semibold">{remainingTimeInHHMM}</span>
			<span>남음</span>
		</div>
	</div>
	{#if currentFocusSessionWithTasks.tasks.length > 0}
		<NavItemSeparator />
		<div class="flex w-full flex-col gap-2.5 px-1">
			{#each currentFocusSessionWithTasks.tasks as task (task.id)}
				<Checkbox
					checked={false}
					name={task.id}
					label={task.title}
					onCheckedChange={() => {
						console.log('Checkbox checked:', task.id);
					}}
					class="w-full"
				/>
			{/each}
		</div>
	{/if}

	<!-- Reflection -->
	<div class="flex items-end justify-end"></div>
</div>
