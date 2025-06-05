<script lang="ts">
	import type { PageProps } from './$types';
	import PriorityChip from '$lib/component/PriorityChip.svelte';
	import NewChildProjectDialog from '$lib/component/project/NewChildProjectDialog.svelte';
	import ProjectEditDialog from '$lib/component/project/ProjectEditDialog.svelte';
	import ProjectDeleteDialog from '$lib/component/project/ProjectDeleteDialog.svelte';
	import ChildProjectContainer from '$lib/component/project/ChildProjectContainer.svelte';

	let { data, form }: PageProps = $props();

	// Type assertions for TypeScript
	let rootProject: App.RootProject = $derived(data.rootProject);
	let childProjects: App.ChildProject[] = $derived(data.childProjects);
</script>

<div class="container mx-auto">
	<!-- Root Project Section -->
	<div class="card variant-filled-surface mb-8">
		<div class="mb-4 flex items-center justify-between">
			<!-- Root Project Header -->
			<div class="flex items-center gap-3">
				<h4 class="h4">
					{rootProject.name}
				</h4>
				<div class="vr text-surface-700-300 pl-3 text-lg">
					{rootProject.goal}
				</div>
				<div class="vr text-surface-700-300 pl-3">
					<PriorityChip priority={rootProject.priority} />
				</div>
			</div>

			<!-- Root Project Actions: Edit & Delete -->
			<div class="flex">
				<ProjectEditDialog {form} {rootProject} />
				<ProjectDeleteDialog {form} />
			</div>
		</div>
	</div>

	<div class="container grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each childProjects as childProject, i (i)}
			<ChildProjectContainer {childProject} action="?/createTask" />
		{/each}

		<NewChildProjectDialog {form} />
	</div>
</div>
