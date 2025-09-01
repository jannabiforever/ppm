<script lang="ts">
	import * as Project from '$lib/modules/projects';
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import Select from '../ui/Select.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { Hash } from 'lucide-svelte';
	import { ICON_PROPS } from '../constants';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		interval: [DateTime.Utc, DateTime.Utc];
	};

	let { open = $bindable(), interval = $bindable(), onOpenChange }: Props = $props();

	/**
	 * 모든 활성 프로젝트 목록 가져오기
	 */
	async function getAllProjects(): Promise<ReadonlyArray<typeof Project.ProjectSchema.Type>> {
		const programResources = Layer.provide(Project.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const s = yield* Project.ApiService;
			const projects = yield* s.getActiveProjects();
			return projects;
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog title="집중 세션 생성하기" bind:open {onOpenChange}>
	{#snippet content()}
		{#if interval !== null}
			<form method="POST" action="/api/focus-sessions" class="flex w-full flex-col gap-3 pt-3">
				<input type="hidden" name="start_at" value={DateTime.formatIso(interval[0])} />
				<input type="hidden" name="end_at" value={DateTime.formatIso(interval[1])} />
				{#await getAllProjects() then projects}
					{@const projectsIncludingInbox = projects
						.map((p) => ({ label: p.name, value: p.id }))
						.concat([{ label: '수집함', value: 'inbox' }])}
					<Select ariaLabel="프로젝트 선택" items={projectsIncludingInbox}>
						{#snippet trigger({ selectedValue })}
							<Hash {...ICON_PROPS.md} class="text-surface-300-700" />
							<span class="ml-3 flex-1 text-start text-sm text-surface-300-700">
								{selectedValue
									? projects.find((p) => p.id === selectedValue)?.name
									: '프로젝트 선택'}
							</span>
						{/snippet}
					</Select>
				{/await}

				<Button filled type="submit">생성</Button>
			</form>
		{/if}
	{/snippet}
</Dialog>
