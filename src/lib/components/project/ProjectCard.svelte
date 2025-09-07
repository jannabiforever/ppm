<script lang="ts">
	import type { ProjectSchema } from '$lib/modules/projects';
	import { Separator } from 'bits-ui';
	import ProjectDropdownMenu from './ProjectDropdownMenu.svelte';
	import ProjectLabel from './ProjectLabel.svelte';

	type Props = {
		project: typeof ProjectSchema.Type;
	};

	let { project }: Props = $props();
</script>

<div class="flex w-full flex-col">
	<div class="flex h-14 w-full items-center rounded-sm px-1 hover:bg-surface-100-900">
		<a href="/app/projects/{project.id}" class="flex h-full flex-1 items-center">
			<ProjectLabel {project} size="md" />
		</a>

		<!-- dropdown menu -->
		<div class="mr-1">
			<ProjectDropdownMenu {project} />
		</div>
	</div>

	<Separator.Root class="mt-1 h-px bg-surface-200-800" orientation="horizontal" />
</div>
