<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Pencil, Plus, X, Check } from '@lucide/svelte';
	import PriorityChip from '$lib/component/PriorityChip.svelte';
	import { Dialog } from 'bits-ui';
	import ProjectDeletebutton from '$lib/component/project/ProjectDeletebutton.svelte';

	let { data }: PageProps = $props();

	let isDialogOpen = $state(false);

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
					<button class="btn btn-sm variant-soft-primary" onclick={startEditingRootProject}>
						<Pencil class="mr-1 size-4" />
						수정
					</button>
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
						<ProjectDeletebutton />
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

	<!-- Add Child Project Form -->
	{#if addingChildProject}
		<div class="card variant-soft-primary mb-6 p-6">
			<h3 class="h3 mb-4">New Child Project</h3>
			<form
				method="POST"
				action="?/createChildProject"
				class="space-y-4"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							addingChildProject = false;
							await invalidate('app:projects');
						}
					};
				}}
			>
				<input type="hidden" name="rootProjectId" value={rootProject.id} />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<label for="childName" class="label">Name</label>
						<input
							id="childName"
							name="name"
							type="text"
							class="input"
							bind:value={newChildName}
							required
						/>
					</div>

					<div class="space-y-2">
						<label for="childGoal" class="label">Goal</label>
						<input
							id="childGoal"
							name="goal"
							type="text"
							class="input"
							bind:value={newChildGoal}
							required
						/>
					</div>
				</div>

				<div class="flex justify-end gap-2">
					<button type="button" class="btn variant-soft-surface" onclick={toggleAddChildProject}>
						<X class="mr-1 size-4" />
						Cancel
					</button>
					<button type="submit" class="btn variant-filled-primary">
						<Check class="mr-1 size-4" />
						Create Child Project
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="container grid grid-cols-2">
		{#each childProjects as childProject, i (i)}
			<div class="card card-hover">{childProject.id}</div>
		{/each}
		<Dialog.Root open={isDialogOpen} onOpenChange={(open) => (isDialogOpen = open)}>
			<Dialog.Trigger
				class="card border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
				onclick={() => (isDialogOpen = true)}
			>
				<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
					<Plus />
				</div>
				<p class="font-medium">새 프로젝트</p>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
				<Dialog.Content
					class="card bg-surface-50-950 primary-300 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-t-4 p-8 shadow-2xl"
				>
					<div class="flex items-center justify-between">
						<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
							<span>새 프로젝트 생성하기</span>
						</Dialog.Title>
						<Dialog.Close
							class="btn-icon bg-primary-50-950 hover:bg-primary-600 h-8 w-8 rounded-full transition-all duration-200"
						>
							<X size={16} />
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	</div>
</div>
