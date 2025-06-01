<script lang="ts">
	import { ArrowUpRight } from '@lucide/svelte';

	let {
		isFocused,
		theme,
		project
	}: {
		isFocused?: boolean;
		theme: 'primary' | 'secondary' | 'tertiary' | 'surface';
		project: App.RootProject;
	} = $props();

	const getPriorityChipPreset = (priority: App.PriorityLevel) => {
		switch (priority) {
			case 'high':
				return 'preset-filled-error-500';
			case 'medium':
				return 'preset-filled-warning-500';
			case 'low':
				return 'preset-filled-success-500';
			case 'system':
				return 'preset-filled-primary-500';
			default:
				return 'preset-filled-warning-500';
		}
	};

	const priorityChipPreset = getPriorityChipPreset(project.priority);
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
				<span class="chip capitalize {priorityChipPreset}">{project.priority}</span>
			</div>
		</div>

		<div class="flex justify-end">
			<a href="/projects/{project.id}" class="btn btn-sm border">
				자세히 보기
				<ArrowUpRight class="ml-1 size-4" />
			</a>
		</div>
	</div>
</div>
