<script lang="ts">
	import { CheckSquare } from '@lucide/svelte';

	let { task }: { task: App.Task } = $props();
</script>

<div class="bg-surface-50-900 border-surface-200-700 flex items-center gap-2 rounded-md border p-2">
	<CheckSquare 
		class={`size-4 ${task.isDone ? 'text-primary-500' : 'text-surface-500'}`} 
	/>
	<span class="truncate text-sm">{task.description}</span>
</div>