<script lang="ts">
	import ProjectLabel from '../project/ProjectLabel.svelte';
	import TaskStatusIcon from './TaskStatusIcon.svelte';
	import type { ProjectSchema } from '$lib/modules/projects';
	import type { TaskSchema } from '$lib/modules/tasks';
	import { Separator } from 'bits-ui';

	interface Props {
		task: typeof TaskSchema.Type;
		project: typeof ProjectSchema.Type | null;
	}

	let { task, project }: Props = $props();
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

		<ProjectLabel {project} size="md" />
	</div>

	<Separator.Root class="mx-1 my-2 h-px bg-surface-200-800" orientation="horizontal" />
</div>
