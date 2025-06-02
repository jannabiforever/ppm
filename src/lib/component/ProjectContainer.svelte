<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import PriorityChip from './PriorityChip.svelte';
	import ChildProjectContainer from './project/ChildProjectContainer.svelte';

	let {
		rootProject,
		childProjects
	}: {
		rootProject: App.RootProject;
		childProjects: App.ChildProject[];
	} = $props();

	let theme = $derived.by(() => {
		switch (rootProject.priority) {
			case 'system':
				return 'primary';
			case 'high':
				return 'error';
			case 'medium':
				return 'warning';
			case 'low':
				return 'surface';
		}
	});

	let isPriorityHigh = $derived(
		rootProject.priority === 'high' || rootProject.priority === 'system'
	);
</script>

<div
	class="card variant-soft-{theme} border-{theme}-500 border-l-8 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl {isPriorityHigh
		? 'col-span-full'
		: ''}"
>
	<div class="p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h4 class="h4 font-semibold">
					{rootProject.name}
				</h4>
				<span class="vr pl-3 text-end"> {rootProject.goal} </span>
			</div>
			<div class="flex items-center">
				<PriorityChip priority={rootProject.priority} />
			</div>
		</div>

		{#if isPriorityHigh}
			<!-- Show description if priority is high enough -->
			{#if childProjects.length > 0}
				{#each childProjects as childProject (childProject.id)}
					<ChildProjectContainer {childProject} />
				{/each}
			{:else}
				<p class="text-surface-500 text-center">하위 프로젝트가 없습니다</p>
			{/if}
		{/if}

		<div class="flex justify-end">
			<a href="/projects/{rootProject.id}" class="btn btn-sm hover:bg-surface-300-700">
				자세히 보기
				<ArrowUpRight class="ml-1 size-4" />
			</a>
		</div>
	</div>
</div>
