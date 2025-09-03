<script>
	import { ICON_PROPS } from '$lib/components/constants';
	import TaskCard from '$lib/components/task/TaskCard.svelte';
	import { Inbox } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex w-full gap-3">
	<Inbox {...ICON_PROPS.lg} />
	<span class="font-semibold">수집함</span>
</div>

<div class="flex w-full flex-col gap-3 pt-8">
	{#each data.inboxTasks as task (task.id)}
		<TaskCard {task} />
	{/each}
</div>
