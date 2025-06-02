<script lang="ts">
	import type { PageProps } from '../../../routes/projects/$types';
	import ProjectContainer from '$lib/component/ProjectContainer.svelte';
	import NewProjectButton from './NewProjectButton.svelte';

	let { data, form }: PageProps = $props();

	const isFocused = (i: number) => {
		return i === 0 || i === 1;
	};
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	{#each data.projects as project, i (project.id)}
		<ProjectContainer {project} isFocused={isFocused(i)} />
	{/each}

	<NewProjectButton {form} />
</div>