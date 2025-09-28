<script lang="ts">
	import type { ProjectSchema } from '$lib/modules/repository/projects';
	import { Archive, Copy, Pencil, Trash } from 'lucide-svelte';
	import DropdownMenu from '../ui/DropdownMenu.svelte';
	import DropdownMenuItem from '../ui/DropdownMenuItem.svelte';
	import { ICON_PROPS } from '../constants';
	import { Separator } from 'bits-ui';

	type Props = {
		project: typeof ProjectSchema.Type;
	};

	let { project }: Props = $props();
</script>

<DropdownMenu>
	{#snippet items()}
		<DropdownMenuItem label="편집" onSelect={() => console.log('수정', project.id)}>
			{#snippet icon()}
				<Pencil {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>
		<DropdownMenuItem label="사본 만들기" onSelect={() => console.log('복사', project.id)}>
			{#snippet icon()}
				<Copy {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>

		<Separator.Root class="mx-1 my-1 h-px bg-surface-200-800" orientation="horizontal" />

		<DropdownMenuItem label="보관" onSelect={() => console.log('보관', project.id)}>
			{#snippet icon()}
				<Archive {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>

		<DropdownMenuItem
			label="삭제"
			onSelect={() => console.log('삭제', project.id)}
			menuClass="text-error-500 hover:text-error-600"
		>
			{#snippet icon()}
				<Trash {...ICON_PROPS.sm} />
			{/snippet}
		</DropdownMenuItem>
	{/snippet}
</DropdownMenu>
