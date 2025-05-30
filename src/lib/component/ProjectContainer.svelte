<script lang="ts">
	import { ArrowUpRight, Layers } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		isFocused,
		theme,
		icon,
		project
	}: {
		isFocused?: boolean;
		theme: 'primary' | 'secondary' | 'tertiary' | 'surface';
		icon?: Snippet;
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
				{#if icon}
					{@render icon()}
				{:else}
					<Layers />
				{/if}
				<h4 class="h4 font-semibold">
					{project.name}
				</h4>
				<span class="vr pl-3 text-end"> {project.goal} </span>
			</div>
			<div class="flex items-center">
				<span class={`chip capitalize ${priorityChipPreset}`}>{project.priority}</span>
			</div>
		</div>

		<div class="flex justify-end">
			<button class="btn btn-sm variant-ghost-{theme}">
				View Details
				<ArrowUpRight class="ml-1 size-4" />
			</button>
		</div>
	</div>
</div>
