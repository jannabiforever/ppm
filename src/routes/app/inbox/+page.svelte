<script>
	import { ICON_PROPS } from '$lib/components/constants';
	import TaskCard from '$lib/components/task/TaskCard.svelte';
	import TaskCreationDialog from '$lib/components/task/TaskCreationDialog.svelte';
	import { Inbox, Plus } from 'lucide-svelte';

	let { data } = $props();

	let hover = $state(false);
	let dialogOpen = $state(false);
</script>

<div class="flex w-full gap-3">
	<Inbox {...ICON_PROPS.lg} />
	<span class="font-semibold">수집함</span>
</div>

<div class="flex w-full flex-col gap-3 pt-8">
	{#each data.inboxTasks as task (task.id)}
		<TaskCard {task} />
	{/each}

	<!-- Creation Dialog-->
	<button
		class="flex items-center gap-1"
		onmouseenter={() => (hover = true)}
		onmouseleave={() => (hover = false)}
		onclick={() => {
			dialogOpen = true;
		}}
	>
		<Plus
			class="rounded-full text-primary-500 {hover
				? 'preset-filled-primary-500 text-surface-50'
				: ''}"
			{...ICON_PROPS.sm}
		/>
		<span class="mt-0.5 text-sm" class:text-surface-500={!hover} class:text-primary-500={hover}>
			태스크 추가
		</span>
	</button>
</div>

{#if dialogOpen}
	<TaskCreationDialog bind:open={dialogOpen} onOpenChange={() => (dialogOpen = false)} />
{/if}
