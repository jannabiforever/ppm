<script lang="ts">
	import { ICON_PROPS } from '$lib/components/constants';
	import ProjectCard from '$lib/components/project/ProjectCard.svelte';
	import ProjectCreationDialog from '$lib/components/project/ProjectCreationDialog.svelte';
	import { FolderKanban, Plus } from 'lucide-svelte';

	let { data } = $props();

	let hover = $state(false);
	let dialogOpen = $state(false);
</script>

<div class="flex w-full items-center justify-between gap-3">
	<div class="flex items-center gap-3">
		<FolderKanban {...ICON_PROPS.lg} />
		<span class="font-semibold">프로젝트</span>
	</div>
</div>

<div class="flex justify-between border-b border-surface-200-800 pb-1">
	<div class="flex gap-1 select-none">
		<span class="flex items-center text-sm text-surface-500"> 활성 프로젝트 목록 </span>
		<span class="flex items-center text-xs text-surface-500">({data.activeProjects.length})</span>
	</div>
</div>
<div class="flex w-full flex-col justify-between gap-3">
	{#each data.activeProjects as project (project.id)}
		<ProjectCard {project} />
	{/each}

	<!-- Creation Dialog-->
	<button
		class="flex items-center gap-1"
		onmouseenter={() => (hover = true)}
		onmouseleave={() => (hover = false)}
		onclick={() => {
			dialogOpen = true;
		}}
	>
		<Plus
			class="rounded-full text-primary-500 {hover
				? 'preset-filled-primary-500 text-surface-50'
				: ''}"
			{...ICON_PROPS.sm}
		/>
		<span class="mt-0.5 text-sm" class:text-surface-500={!hover} class:text-primary-500={hover}>
			프로젝트 추가
		</span>
	</button>
</div>

{#if dialogOpen}
	<ProjectCreationDialog bind:open={dialogOpen} onOpenChange={(open) => (dialogOpen = open)} />
{/if}
