<script lang="ts">
	import Checkbox from '../ui/Checkbox.svelte';
	import NavItemSeparator from './NavItemSeparator.svelte';
	import { AlarmClock } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import type { FocusSessionWithAssignedTasksSchema } from '$lib/applications/session-task-management/types';
	import { currentTime } from '$lib/stores/time';
	import { ProjectSchema } from '$lib/modules/projects';

	type Props = {
		focusSessionWithAssignedTasks: typeof FocusSessionWithAssignedTasksSchema.Type;
		project: typeof ProjectSchema.Type | null;
	};

	let { focusSessionWithAssignedTasks, project }: Props = $props();

	let remainingTimeInSeconds = $derived(
		(focusSessionWithAssignedTasks.end_at.epochMillis - currentTime.getTime()) / 1000
	);

	/**
	 * remaining time in {hh}h {mm}m format.
	 * ex) 1h 30m
	 */
	let remainingTimeInHHMM = $derived.by(() => {
		const hours = Math.floor(remainingTimeInSeconds / 3600);
		const minutes = Math.ceil((remainingTimeInSeconds % 3600) / 60);
		return `${hours.toString()}h ${minutes.toString().padStart(2, '0')}m`;
	});
</script>

{#if remainingTimeInSeconds > 0}
	<div class="flex w-full flex-col gap-2 rounded-sm border border-surface-200-800 p-4">
		<div class="flex items-center gap-2.5">
			<AlarmClock {...ICON_PROPS.md} />
			<span class="text-semibold">현재 집중 세션</span>
		</div>
		<NavItemSeparator />
		<div class="flex w-full flex-col">
			<span class="font-semibold">{project?.name ?? '수집함'}</span>
			<div class="flex items-center gap-3 py-2">
				<span class="text-[24px] font-semibold">{remainingTimeInHHMM}</span>
				<span>남음</span>
			</div>
		</div>
		{#if focusSessionWithAssignedTasks.tasks.length > 0}
			<NavItemSeparator />
			<div class="flex w-full flex-col gap-2.5 px-1">
				{#each focusSessionWithAssignedTasks.tasks as task (task.id)}
					<Checkbox
						checked={task.status === 'completed'}
						name={task.id}
						label={task.title}
						onCheckedChange={() => {
							// TODO: api call to update task status
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
{/if}
