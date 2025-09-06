<script lang="ts">
	import TaskStatusIcon from './TaskStatusIcon.svelte';
	import type { TaskSchema } from '$lib/modules/tasks';
	import { Separator } from 'bits-ui';
	import TaskDueDateSpan from './taskDueDateSpan.svelte';

	interface Props {
		task: typeof TaskSchema.Type;
	}

	let { task }: Props = $props();
</script>

<div class="flex flex-col justify-center gap-4">
	<div class="flex flex-col justify-center gap-4">
		<div class="flex justify-between">
			<div class="flex flex-col gap-1">
				<span>{task.title}</span>
				{#if task.description}
					<span class="text-xs text-surface-400-600">{task.description}</span>
				{/if}
			</div>
			<TaskStatusIcon {task} size="md" />
		</div>
		{#if task.planned_for}
			<TaskDueDateSpan date={task.planned_for} />
		{/if}
	</div>

	<Separator.Root class="mt-2 h-px bg-surface-200-800" orientation="horizontal" />
</div>
