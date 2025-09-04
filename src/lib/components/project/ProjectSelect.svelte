<script lang="ts">
	import { Effect, Layer } from 'effect';
	import Select from '../ui/Select.svelte';
	import { FetchHttpClient } from '@effect/platform';
	import { Project } from '$lib/modules';
	import { ICON_PROPS } from '../constants';
	import { onMount } from 'svelte';
	import { Hash } from 'lucide-svelte';
	import ProjectLabel from './ProjectLabel.svelte';

	type Props = {
		/**
		 * Default value of projectId.
		 * If not presented, it fallbacks to `null`, which enfers the inbox.
		 */
		projectId?: string | null;
	};

	let { projectId = $bindable(null) }: Props = $props();
	let allProjectsExcludeInbox: Array<typeof Project.ProjectSchema.Type> = $state([]);
	let projectItemsIncludingInbox: Array<{
		label: string;
		value: string;
	}> = $derived.by(() => {
		return [
			{ label: '수집함', value: 'Inbox' },
			...allProjectsExcludeInbox.map((project) => ({
				label: project.name,
				value: project.id
			}))
		];
	});

	async function getAllProjects(): Promise<ReadonlyArray<typeof Project.ProjectSchema.Type>> {
		const programResources = Layer.provide(Project.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const s = yield* Project.ApiService;
			const projects = yield* s.getActiveProjects();
			return projects;
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}

	/**
	 * The value used in the Select component.
	 * When updated, it automatically updates the `projectId`.
	 *
	 * Note that `selectedValue === null` doesn't mean that the inbox is selected, but that no item is selected.
	 * Associated value for inbox is 'Inbox'.
	 */
	let selectedValue = $state<string | null>(null);
	$effect(() => {
		if (selectedValue === null) return;
		if (selectedValue === 'Inbox') {
			projectId = null;
			return;
		}
		projectId = selectedValue;
	});

	onMount(async () => {
		const projects = await getAllProjects();
		allProjectsExcludeInbox.push(...projects);

		if (projectId === null) selectedValue = 'Inbox';
		else selectedValue = projectId;
	});
</script>

<Select ariaLabel="프로젝트 선택" items={projectItemsIncludingInbox} bind:selectedValue>
	{#snippet trigger({ selectedValue })}
		{#if selectedValue === null}
			<div class="flex items-center gap-2">
				<Hash {...ICON_PROPS.sm} class="text-surface-300-700" />
				<span class="text-sm text-surface-300-700">프로젝트 선택</span>
			</div>
		{:else}
			<ProjectLabel
				size="sm"
				project={allProjectsExcludeInbox.find((p) => p.id === projectId) ?? null}
			/>
		{/if}
	{/snippet}
</Select>
