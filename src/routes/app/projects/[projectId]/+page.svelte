<script>
	import { ICON_PROPS } from '$lib/components/constants';
	import TaskCard from '$lib/components/task/TaskCard.svelte';
	import TaskCreationDialog from '$lib/components/task/TaskCreationDialog.svelte';
	import { Hash, Plus } from 'lucide-svelte';
	import { page } from '$app/state';

	let { data } = $props();

	let hover = $state(false);
	let dialogOpen = $state(false);
</script>

<div class="flex w-full gap-3">
	<Hash {...ICON_PROPS.lg} />
	<span class="font-semibold">{data.project.name}</span>
</div>

<div class="flex w-full gap-3">
	{#if data.project.description}
		<span class="text-sm text-surface-500">{data.project.description}</span>
	{/if}
</div>

<div class="flex w-full flex-col gap-3 pt-8">
	{#each data.tasks as task (task.id)}
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
	<TaskCreationDialog
		projectId={page.params.projectId}
		bind:open={dialogOpen}
		onOpenChange={() => (dialogOpen = false)}
	/>
{/if}
