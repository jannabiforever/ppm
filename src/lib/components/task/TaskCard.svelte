<script lang="ts">
	import TaskStatusIcon from './TaskStatusIcon.svelte';
	import type { TaskSchema } from '$lib/modules/repository/tasks';
	import { Separator } from 'bits-ui';
	import TaskDueDateSpan from './taskDueDateSpan.svelte';
	import TaskDropdownMenu from './TaskDropdownMenu.svelte';

	interface Props {
		task: typeof TaskSchema.Type;
	}

	let { task }: Props = $props();
</script>

<div class="flex flex-col justify-center gap-4">
	<div class="flex flex-col justify-center gap-4">
		<div class="flex gap-3">
			<TaskStatusIcon {task} size="sm" />
			<div class="flex flex-1 flex-col gap-1">
				<span class="text-sm">{task.title}</span>
				{#if task.description}
					<span class="text-xs text-surface-400-600">{task.description}</span>
				{/if}
			</div>
			<div class="mr-1">
				<TaskDropdownMenu {task} />
			</div>
		</div>
		{#if task.planned_for}
			<TaskDueDateSpan date={task.planned_for} />
		{/if}
	</div>

	<Separator.Root class="mt-2 h-px bg-surface-200-800" orientation="horizontal" />
</div>
