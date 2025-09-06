<script lang="ts">
	import { ProjectSchema } from '$lib/modules/projects';
	import { Hash, Inbox } from 'lucide-svelte';
	import { getIconProps, getTextSizeClass } from '../constants';

	type Props = {
		/**
		 * project. null if inbox
		 */
		project: typeof ProjectSchema.Type | null;
		size: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	};

	let { project, size = 'md' }: Props = $props();
</script>

{#if project === null}
	<!-- inbox -->
	<div class="flex items-center gap-2 select-none">
		<Inbox {...getIconProps(size)} />
		<span class={getTextSizeClass(size)}>수집함</span>
	</div>
{:else}
	<!-- normal project -->
	<div class="flex items-center gap-2 select-none">
		<Hash {...getIconProps(size)} />
		<span class={getTextSizeClass(size)}>{project.name}</span>
	</div>
{/if}
