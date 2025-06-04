<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { X, Check } from '@lucide/svelte';
	import PriorityChip from '$lib/component/PriorityChip.svelte';
	import ProjectDeleteDialog from '$lib/component/project/ProjectDeleteDialog.svelte';
	import NewChildProjectDialog from '$lib/component/project/NewChildProjectDialog.svelte';
	import ProjectEditButton from '$lib/component/project/ProjectEditDialog.svelte';

	let { data }: PageProps = $props();

	// Type assertions for TypeScript
	let rootProject: App.RootProject = $derived(data.rootProject);
	let childProjects: App.ChildProject[] = $derived(data.childProjects);

	// State for edit modes
	let editingRootProject = $state(false);
	let editingChildProjectId = $state<string | null>(null);
	let addingChildProject = $state(false);

	// Edited values for root project
	let editedName = $derived(rootProject.name);
	let editedGoal = $derived(rootProject.goal);
	let editedPriority = $derived(rootProject.priority);

	// New child project values
	let newChildName = $state('');
	let newChildGoal = $state('');

	// Edited values for child projects
	let editedChildName = $state('');
	let editedChildGoal = $state('');

	// Function to start editing root project
	function startEditingRootProject() {
		editingRootProject = true;
		editedName = rootProject.name;
		editedGoal = rootProject.goal;
		editedPriority = rootProject.priority;
	}

	// Function to cancel editing root project
	function cancelEditingRootProject() {
		editingRootProject = false;
	}

	// Function to start editing child project
	function startEditingChildProject(childProject: App.ChildProject) {
		editingChildProjectId = childProject.id;
		editedChildName = childProject.name;
		editedChildGoal = childProject.goal;
	}

	// Function to cancel editing child project
	function cancelEditingChildProject() {
		editingChildProjectId = null;
	}

	// Function to toggle adding new child project
	function toggleAddChildProject() {
		addingChildProject = !addingChildProject;
		if (addingChildProject) {
			newChildName = '';
			newChildGoal = '';
		}
	}

	// Priority options
	const priorityOptions: App.PriorityLevel[] = ['system', 'high', 'medium', 'low'];
</script>

<div class="container mx-auto">
	<!-- Root Project Section -->
	<div class="card variant-filled-surface mb-8">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h4 class="h4">
					{rootProject.name}
				</h4>
				<div class="vr text-surface-700-300 pl-3 text-lg">{rootProject.goal}</div>
				<div class="vr text-surface-700-300 pl-3">
					<PriorityChip priority={rootProject.priority} />
				</div>
			</div>
			<div class="flex gap-2">
				{#if !editingRootProject}
					<ProjectEditButton />
					<form
						method="POST"
						action="?/deleteRootProject"
						use:enhance={() => {
							return async ({ result }) => {
								if (result.type === 'success') {
									await invalidate('app:projects');
								}
							};
						}}
					>
						<input type="hidden" name="id" value={rootProject.id} />
						<ProjectDeleteDialog />
					</form>
				{/if}
			</div>
		</div>

		{#if editingRootProject}
			<!-- Root Project Edit Form -->
			<form
				method="POST"
				action="?/updateRootProject"
				class="space-y-4"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							editingRootProject = false;
							await invalidate('app:projects');
						}
					};
				}}
			>
				<input type="hidden" name="id" value={rootProject.id} />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label for="name" class="label">Name</label>
						<input
							id="name"
							name="name"
							type="text"
							class="input"
							bind:value={editedName}
							required
						/>
					</div>

					<div class="space-y-2">
						<label for="goal" class="label">Goal</label>
						<input
							id="goal"
							name="goal"
							type="text"
							class="input"
							bind:value={editedGoal}
							required
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="priority" class="label">Priority</label>
					<div class="flex flex-wrap gap-2">
						{#each priorityOptions as priority, i (i)}
							<label class="flex items-center space-x-2">
								<input
									type="radio"
									name="priority"
									value={priority}
									checked={editedPriority === priority}
									bind:group={editedPriority}
									class="radio"
								/>
								<PriorityChip {priority} />
							</label>
						{/each}
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button type="button" class="btn variant-soft-surface" onclick={cancelEditingRootProject}>
						<X class="mr-1 size-4" />
						Cancel
					</button>
					<button type="submit" class="btn variant-filled-primary">
						<Check class="mr-1 size-4" />
						Save Changes
					</button>
				</div>
			</form>
		{/if}
	</div>

	<div class="container grid grid-cols-1 md:grid-cols-2">
		{#each childProjects as childProject, i (i)}
			<div class="card card-hover">{childProject.id}</div>
		{/each}

		<NewChildProjectDialog />
	</div>
</div>
