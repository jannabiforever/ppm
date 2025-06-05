<script lang="ts">
	import NewProjectButton from '$lib/component/project/NewProjectDialog.svelte';
	import ProjectPlaceholder from '$lib/component/project/ProjectPlaceholder.svelte';
	import ProjectContainer from '$lib/component/project/ProjectContainer.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	{#each data.projects as project, i (i)}
		{#await project}
			<ProjectPlaceholder />
		{:then project}
			<ProjectContainer rootProject={project.rootProject} childProjects={project.childProjects} tasksMap={project.tasksMap} />
		{/await}
	{/each}

	<NewProjectButton {form} />
</div>
