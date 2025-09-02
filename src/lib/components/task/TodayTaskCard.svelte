<script lang="ts">
	import { Hash } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import TaskStatusIcon from './TaskStatusIcon.svelte';
	import { Separator } from 'bits-ui';
	import type { TaskSchema } from '$lib/modules/tasks';

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
			<TaskStatusIcon {task} iconProps={ICON_PROPS.md} />
		</div>

		<div class="flex justify-end gap-1 text-surface-400-600">
			<Hash {...ICON_PROPS.sm} />
			<span class="text-xs">{task.project_id ?? '수집함'}</span>
		</div>
	</div>

	<Separator.Root class="mx-1 my-2 h-px bg-surface-200-800" orientation="horizontal" />
</div>
