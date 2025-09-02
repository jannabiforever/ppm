<script lang="ts">
	import * as Project from '$lib/modules/projects';
	import * as FocusSession from '$lib/modules/focus_sessions';
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import Select from '../ui/Select.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { Hash } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		interval: [DateTime.Utc, DateTime.Utc];
	};

	let { open = $bindable(), interval = $bindable(), onOpenChange }: Props = $props();
	let selectedProjectId: string | null = $state(null);

	async function getAllProjects(): Promise<ReadonlyArray<typeof Project.ProjectSchema.Type>> {
		const programResources = Layer.provide(Project.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const s = yield* Project.ApiService;
			const projects = yield* s.getActiveProjects();
			return projects;
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}

	async function createFocusSession(): Promise<{ id: string }> {
		const programResources = Layer.provide(FocusSession.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const s = yield* FocusSession.ApiService;
			return yield* s.createFocusSession({
				start_at: DateTime.formatIso(interval[0]),
				end_at: DateTime.formatIso(interval[1]),
				project_id: selectedProjectId
			});
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog title="집중 세션 생성하기" bind:open {onOpenChange}>
	{#snippet content()}
		{#if interval !== null}
			{#await getAllProjects() then projects}
				{@const projectsIncludingInbox = projects
					.map((p) => ({ label: p.name, value: p.id }))
					.concat([{ label: '수집함', value: 'inbox' }])}
				<Select
					ariaLabel="프로젝트 선택"
					items={projectsIncludingInbox}
					bind:selectedValue={selectedProjectId}
				>
					{#snippet trigger({ selectedValue })}
						<Hash {...ICON_PROPS.md} class="text-surface-300-700" />
						<span class="ml-3 flex-1 text-start text-sm text-surface-300-700">
							{selectedValue
								? projectsIncludingInbox.find((p) => p.value === selectedValue)?.label
								: '프로젝트 선택'}
						</span>
					{/snippet}
				</Select>
			{/await}

			<Button
				class="w-full"
				type="button"
				filled
				onclick={async () => {
					await createFocusSession();
					onOpenChange?.(false);
					await invalidateAll();
				}}
			>
				생성
			</Button>
		{/if}
	{/snippet}
</Dialog>
