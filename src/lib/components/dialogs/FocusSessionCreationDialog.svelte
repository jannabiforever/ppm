<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import Select from '../ui/Select.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { Hash, Inbox } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';
	import { invalidateAll } from '$app/navigation';
	import { FocusSession, Project } from '$lib/modules';

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
				project_id: selectedProjectId === 'inbox' ? null : selectedProjectId
			});
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog title="집중 세션 생성하기" bind:open {onOpenChange}>
	{#snippet content()}
		{#if interval !== null}
			<div class="flex w-full flex-col gap-3">
				<div class="flex w-full items-center justify-between">
					<span>소속 프로젝트 선택</span>
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
								{#if selectedProjectId === 'inbox'}
									<Inbox
										{...ICON_PROPS.md}
										class={selectedProjectId ? '' : 'text-surface-300-700'}
									/>
								{:else}
									<Hash
										{...ICON_PROPS.md}
										class={selectedProjectId ? '' : 'text-surface-300-700'}
									/>
								{/if}
								<span
									class="ml-1.5 flex-1 text-start text-sm"
									class:text-surface-300-700={selectedProjectId === null}
								>
									{selectedValue
										? projectsIncludingInbox.find((p) => p.value === selectedValue)?.label
										: '프로젝트 선택'}
								</span>
							{/snippet}
						</Select>
					{/await}
				</div>

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
			</div>
		{/if}
	{/snippet}
</Dialog>
