<script lang="ts">
	import { Dialog } from 'bits-ui';
	import ProjectContainer from '$lib/component/ProjectContainer.svelte';
	import type { PageProps } from './$types';
	import { Plus } from '@lucide/svelte';

	let { data }: PageProps = $props();

	const themeAndIconMap: Array<'primary' | 'secondary' | 'tertiary' | 'surface'> = [
		'primary',
		'secondary',
		'surface'
	];

	const isFocused = (i: number) => {
		return i === 0 || i === 1;
	};

	const getTheme = (i: number) => {
		if (isFocused(i)) {
			return themeAndIconMap[i];
		} else {
			return themeAndIconMap[2];
		}
	};
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	{#each data.projects as project, i (i)}
		<ProjectContainer theme={getTheme(i)} {project} isFocused={isFocused(i)} />
	{/each}

	<Dialog.Root>
		<Dialog.Trigger
			class="card border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
		>
			<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
				<Plus />
			</div>
			<p class="text-surface-700 dark:text-surface-300 font-medium">Add New Project</p>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay />
			<Dialog.Content>
				<Dialog.Title />
				<Dialog.Description />
				<Dialog.Close />
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
</div>
