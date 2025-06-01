<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';
	import PriorityChip from './PriorityChip.svelte';

	let {
		isFocused,
		project
	}: {
		isFocused?: boolean;
		project: App.RootProject;
	} = $props();

	let theme = $derived.by(() => {
		switch (project.priority) {
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
</script>

<div
	class="card variant-soft-{theme} border-{theme}-500 border-l-8 shadow-lg transition-all duration-200 hover:translate-y-[-2px] hover:shadow-xl {isFocused
		? 'col-span-full'
		: ''}"
>
	<div class="p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h4 class="h4 font-semibold">
					{project.name}
				</h4>
				<span class="vr pl-3 text-end"> {project.goal} </span>
			</div>
			<div class="flex items-center">
				<PriorityChip priority={project.priority} />
			</div>
		</div>

		<div class="flex justify-end">
			<a href="/projects/{project.id}" class="btn btn-sm hover:bg-surface-300-700">
				자세히 보기
				<ArrowUpRight class="ml-1 size-4" />
			</a>
		</div>
	</div>
</div>
