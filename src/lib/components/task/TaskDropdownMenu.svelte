<script lang="ts">
	import DropdownMenu from '../ui/DropdownMenu.svelte';
	import DropdownMenuItem from '../ui/DropdownMenuItem.svelte';
	import TaskEditDialog from './TaskEditDialog.svelte';
	import { Calendar, Pencil } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { TaskSchema } from '$lib/modules/tasks';

	type Props = {
		task: typeof TaskSchema.Type;
	};

	let { task }: Props = $props();

	let mode = $state<'idle' | 'edit'>('idle');
</script>

<DropdownMenu>
	{#snippet items()}
		<DropdownMenuItem label="편집" onSelect={() => (mode = 'edit')}>
			{#snippet icon()}
				<Pencil {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>
		<DropdownMenuItem label="날짜 선택" onSelect={() => console.log('날짜 선택', task.id)}>
			{#snippet icon()}
				<Calendar {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>
	{/snippet}
</DropdownMenu>

<TaskEditDialog
	{task}
	open={mode === 'edit'}
	onOpenChange={(open) => (mode = open ? 'edit' : 'idle')}
/>
