<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { invalidateAll } from '$app/navigation';
	import { FocusSession } from '$lib/modules';
	import ProjectSelect from '../project/ProjectSelect.svelte';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		interval: [DateTime.Utc, DateTime.Utc];
	};

	let { open = $bindable(), interval = $bindable(), onOpenChange }: Props = $props();
	let selectedProjectId: string | null = $state(null);

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
					<span class="text-sm">소속 프로젝트 선택</span>
					<ProjectSelect />
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
