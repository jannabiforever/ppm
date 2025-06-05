<script lang="ts">
	import type { PageProps } from './$types';
	import PriorityChip from '$lib/component/PriorityChip.svelte';
	import NewChildProjectDialog from '$lib/component/project/NewChildProjectDialog.svelte';
	import ProjectEditDialog from '$lib/component/project/ProjectEditDialog.svelte';
	import ChildProjectContainer from '$lib/component/project/ChildProjectContainer.svelte';
	import DeleteConfirmDialog from '$lib/component/common/DeleteConfirmDialog.svelte';
	import { Trash } from '@lucide/svelte';

	let { data, form }: PageProps = $props();

	// Type assertions for TypeScript
	let rootProject: App.RootProject = $derived(data.rootProject);
	let childProjects: App.ChildProject[] = $derived(data.childProjects);
	let tasksMap: Record<string, App.Task> = $derived(data.tasksMap);
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
				<DeleteConfirmDialog 
					entityName="프로젝트" 
					entityId={rootProject.id} 
					actionPath="?/deleteRootProject" 
					warningMessage="해당 작업은 복구할 수 없습니다. 그래도 진행하시겠습니까?"
					triggerButtonClass="btn hover:bg-surface-300-700"
					navigateTo="/projects"
					successMessage="프로젝트가 성공적으로 삭제되었습니다. 3초 후 프로젝트 목록으로 이동합니다."
					{form}
				>
					{#snippet triggerContent()}
						<Trash class="mr-1 size-4" /> 삭제
					{/snippet}
				</DeleteConfirmDialog>
			</div>
		</div>
	</div>

	<div class="container grid grid-cols-1 gap-4 md:grid-cols-2">
		{#each childProjects as childProject, i (i)}
			<ChildProjectContainer {childProject} {tasksMap} {form} action="?/createTask" />
		{/each}

		<NewChildProjectDialog {form} />
	</div>
</div>
