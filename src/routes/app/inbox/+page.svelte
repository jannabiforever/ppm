<script>
	import { ICON_PROPS } from '$lib/components/constants';
	import TodayTaskCard from '$lib/components/task/TodayTaskCard.svelte';
	import { Inbox } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="flex w-full gap-3">
	<Inbox {...ICON_PROPS.lg} />
	<span class="font-semibold">수집함</span>
</div>

<div>
	{#each data.inboxTasks as task (task.id)}
		<TodayTaskCard {task} />
	{/each}
</div>
