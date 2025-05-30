<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { enhance } from '$app/forms';
	import ProjectContainer from '$lib/component/ProjectContainer.svelte';
	import type { PageProps } from './$types';
	import { Plus, X, Check } from '@lucide/svelte';
	import { invalidateAll } from '$app/navigation';

	let { data, form }: PageProps = $props();

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

	// New project form data with state
	let newProject = $state({
		name: '',
		goal: '',
		priority: 1
	});

	// Form validation state
	let nameError = $state('');
	let goalError = $state('');
	let priorityError = $state('');
	let showSuccessMessage = $state(false);
	let isSubmitting = $state(false);

	let isDialogOpen = $state(false);

	// Process form response
	$effect(() => {
		if (form?.success) {
			showSuccessMessage = true;
			// Reset form
			newProject.name = '';
			newProject.goal = '';
			newProject.priority = 1;
			
			// Close dialog after a delay
			setTimeout(() => {
				isDialogOpen = false;
				setTimeout(() => {
					showSuccessMessage = false;
				}, 300);
			}, 1000);
		}
	});
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	{#each data.projects as project, i (i)}
		<ProjectContainer theme={getTheme(i)} {project} isFocused={isFocused(i)} />
	{/each}

	<Dialog.Root open={isDialogOpen} onOpenChange={(open) => (isDialogOpen = open)}>
		<Dialog.Trigger
			class="card border-surface-300 dark:border-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 flex flex-col items-center justify-center border border-dashed p-6 transition-all duration-200"
			onclick={() => (isDialogOpen = true)}
		>
			<div class="bg-surface-100 dark:bg-surface-800 mb-3 rounded-full p-3">
				<Plus />
			</div>
			<p class="font-medium">Add New Project</p>
		</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 z-50 backdrop-blur-sm" />
			<Dialog.Content
				class="card border-primary-300 fixed top-1/2 left-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-xl border-l-4 p-8 shadow-2xl"
			>
				<div class="flex items-center justify-between">
					<Dialog.Title class="flex items-center gap-2 text-2xl font-bold">
						<span>Add New Project</span>
					</Dialog.Title>
					<Dialog.Close
						class="btn-icon bg-primary-50-950 hover:bg-primary-600 h-8 w-8 rounded-full transition-all duration-200"
					>
						<X size={16} />
					</Dialog.Close>
				</div>

				<Dialog.Description class="-mt-1 text-sm">
					Create a new project to organize your work and track your progress.
				</Dialog.Description>

				{#if showSuccessMessage}
					<div
						class="bg-success-600/20 border-success-400 text-success-100 flex animate-pulse items-center gap-2 rounded-lg border p-4 backdrop-blur-sm"
					>
						<div class="bg-success-400 rounded-full p-1">
							<Check size={14} class="text-success-900" />
						</div>
						<span class="font-medium">Project created successfully!</span>
					</div>
				{/if}
				{#if form?.error && !form?.success}
					<div
						class="bg-red-600/20 border-red-400 text-red-100 flex items-center gap-2 rounded-lg border p-4 backdrop-blur-sm"
					>
						<div class="bg-red-400 rounded-full p-1">
							<X size={14} class="text-red-900" />
						</div>
						<span class="font-medium">{form.error}</span>
					</div>
				{/if}
				<form 
					class="grid gap-6" 
					method="POST" 
					action="?/addNewProject"
					use:enhance={() => {
						isSubmitting = true;
						
						return ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								invalidateAll();
							}
						};
					}}
				>
					<div class="grid gap-2">
						<label for="name" class="flex items-center gap-1.5 text-sm font-medium">
							Project Name
							<span class="text-xs">(required)</span>
						</label>
						<input
							type="text"
							id="name"
							class="input border-primary-400/30 focus:border-primary-300 h-11 rounded-lg border"
							bind:value={newProject.name}
							placeholder="Enter project name"
							maxlength="50"
							required
						/>
						{#if nameError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{nameError}
							</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<label for="goal" class="flex items-center gap-1.5 text-sm font-medium">
							Project Goal
							<span class="text-xs">(required)</span>
						</label>
						<input
							type="text"
							id="goal"
							class="input border-primary-400/30 focus:border-primary-300 h-11 rounded-lg border"
							bind:value={newProject.goal}
							placeholder="Enter project goal"
							maxlength="100"
							required
						/>
						{#if goalError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{goalError}
							</p>
						{/if}
					</div>

					<div class="grid gap-2">
						<label for="priority" class="flex items-center gap-1.5 text-sm font-medium">
							Priority
							<span class="text-xs">(1-10)</span>
						</label>
						<div class="relative">
							<input
								type="number"
								id="priority"
								class="input border-primary-400/30 focus:border-primary-300 h-11 rounded-lg border pr-10"
								bind:value={newProject.priority}
								min="1"
								max="10"
								required
							/>
							<div class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">/10</div>
						</div>
						{#if priorityError}
							<p class="mt-1 flex items-center gap-1 text-xs font-medium text-red-200">
								<X size={12} class="text-red-300" />
								{priorityError}
							</p>
						{/if}
						<p class="mt-1 text-xs italic">Higher numbers indicate lower priority</p>
					</div>

					<div class="mt-2 flex justify-end gap-3">
						<button
							type="button"
							class="btn h-10 bg-red-400 px-4 transition-all duration-200"
							onclick={() => (isDialogOpen = false)}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							class="btn bg-primary-50-950 hover:bg-primary-200-800 flex h-10 items-center gap-1 px-5 font-medium transition-all duration-200"
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
								<span class="ml-2">Submitting...</span>
							{:else}
								<Plus size={16} />
								Create Project
							{/if}
						</button>
					</div>
					<p class="mt-3 border-t pt-3 text-center text-xs">
						New projects will appear in your project list after creation
					</p>
				</form>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
</div>
