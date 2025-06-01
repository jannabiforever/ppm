<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Pencil, Trash, Plus, X, Check } from '@lucide/svelte';

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
	const priorityOptions: App.PriorityLevel[] = ['high', 'medium', 'low', 'system'];

	// Function to get priority chip class
	function getPriorityChipClass(priority: App.PriorityLevel): string {
		switch (priority) {
			case 'high':
				return 'variant-filled-error';
			case 'medium':
				return 'variant-filled-warning';
			case 'low':
				return 'variant-filled-success';
			case 'system':
				return 'variant-filled-primary';
			default:
				return 'variant-filled-warning';
		}
	}
</script>

<div class="container mx-auto">
	<!-- Root Project Section -->
	<div class="card variant-filled-surface mb-8">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h4 class="h4">
					{rootProject.name}
				</h4>
				<div class="vr text-surface-700-300 pl-3">{rootProject.goal}</div>
			</div>
			<div class="flex gap-2">
				{#if !editingRootProject}
					<button class="btn btn-sm variant-soft-primary" onclick={startEditingRootProject}>
						<Pencil class="mr-1 size-4" />
						Edit
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
						<button class="btn btn-sm variant-soft-error" type="submit">
							<Trash class="mr-1 size-4" />
							Delete
						</button>
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
								<span class="chip {getPriorityChipClass(priority)} capitalize">{priority}</span>
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
		{:else}
			<!-- Root Project Display -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="space-y-2">
					<p class="text-sm opacity-75">Priority</p>
					<div>
						<span class="chip {getPriorityChipClass(rootProject.priority)} capitalize">
							{rootProject.priority}
						</span>
					</div>
				</div>

				<div class="space-y-2">
					<p class="text-sm opacity-75">Child Projects</p>
					<p class="text-xl font-semibold">{childProjects.length}</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Child Projects Section -->
	<div class="mb-6 flex items-center justify-between">
		<h2 class="h2">Child Projects</h2>
		{#if !addingChildProject}
			<button class="btn variant-soft-primary" onclick={toggleAddChildProject}>
				<Plus class="mr-1 size-4" />
				Add Child Project
			</button>
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

	<!-- Child Projects List -->
	{#if childProjects.length > 0}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each childProjects as childProject (childProject.id)}
				<div class="card variant-soft-surface p-6">
					{#if editingChildProjectId === childProject.id}
						<!-- Child Project Edit Form -->
						<form
							method="POST"
							action="?/updateChildProject"
							class="space-y-4"
							use:enhance={() => {
								return async ({ result }) => {
									if (result.type === 'success') {
										editingChildProjectId = null;
										await invalidate('app:projects');
									}
								};
							}}
						>
							<input type="hidden" name="id" value={childProject.id} />

							<div class="space-y-2">
								<label for="childName_{childProject.id}" class="label">Name</label>
								<input
									id="childName_{childProject.id}"
									name="name"
									type="text"
									class="input"
									bind:value={editedChildName}
									required
								/>
							</div>

							<div class="space-y-2">
								<label for="childGoal_{childProject.id}" class="label">Goal</label>
								<input
									id="childGoal_{childProject.id}"
									name="goal"
									type="text"
									class="input"
									bind:value={editedChildGoal}
									required
								/>
							</div>

							<div class="flex justify-end gap-2">
								<button
									type="button"
									class="btn btn-sm variant-soft-surface"
									onclick={cancelEditingChildProject}
								>
									<X class="mr-1 size-4" />
									Cancel
								</button>
								<button type="submit" class="btn btn-sm variant-filled-primary">
									<Check class="mr-1 size-4" />
									Save
								</button>
							</div>
						</form>
					{:else}
						<!-- Child Project Display -->
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h3 class="h3 mb-2">{childProject.name}</h3>
								<p class="text-base opacity-90">{childProject.goal}</p>
							</div>
							<div class="flex gap-2">
								<button
									class="btn btn-sm variant-soft-primary"
									onclick={() => startEditingChildProject(childProject)}
								>
									<Pencil class="size-4" />
								</button>
								<form
									method="POST"
									action="?/deleteChildProject"
									use:enhance={() => {
										return async ({ result }) => {
											if (result.type === 'success') {
												await invalidate('app:projects');
											}
										};
									}}
								>
									<input type="hidden" name="id" value={childProject.id} />
									<button class="btn btn-sm variant-soft-error" type="submit">
										<Trash class="size-4" />
									</button>
								</form>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<div class="space-y-2">
								<p class="text-sm opacity-75">Tasks</p>
								<p class="text-lg font-semibold">{childProject.tasks.length}</p>
							</div>
							<a
								href="/projects/{rootProject.id}/child/{childProject.id}"
								class="btn btn-sm variant-soft-primary"
							>
								View Tasks
							</a>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="card variant-ghost-surface p-6 text-center">
			<p class="text-lg">No child projects yet. Create one to get started!</p>
		</div>
	{/if}
</div>
