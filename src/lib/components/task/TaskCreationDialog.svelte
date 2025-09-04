<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { invalidateAll } from '$app/navigation';
	import { Task } from '$lib/modules';
	import TextInput from '../ui/TextInput.svelte';
	import ProjectSelect from '../project/ProjectSelect.svelte';
	import DatePicker from '../ui/DatePicker.svelte';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		projectId?: string | null;
	};

	let { open = $bindable(), onOpenChange, projectId = null }: Props = $props();

	let title = $state('');
	let description = $state('');
	let plannedFor = $state<DateTime.Utc | null>(null);

	let plannedForString = $derived.by(() => {
		if (!plannedFor) return null;
		return DateTime.formatIso(plannedFor);
	});

	async function createTask(): Promise<{ id: string }> {
		const programResources = Layer.provide(Task.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const s = yield* Task.ApiService;
			return yield* s.createTask({
				title,
				description,
				project_id: projectId,
				planned_for: plannedForString
			});
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog title="태스크 생성하기" bind:open {onOpenChange}>
	{#snippet content()}
		<div class="flex w-full flex-col gap-3">
			<!-- title -->
			<div class="flex w-full items-center justify-between">
				<TextInput
					label="제목"
					placeholder="태스크 제목을 입력하세요"
					name="title"
					bind:value={title}
				/>
			</div>

			<!-- description -->
			<div class="flex w-full items-center justify-between">
				<TextInput
					label="설명"
					placeholder="태스크 설명을 입력하세요"
					name="description"
					bind:value={description}
				/>
			</div>

			<!-- planned_for -->
			<div class="flex w-full items-center justify-between">
				<DatePicker bind:utc={plannedFor} label="작업 날짜 (선택)" afterToday={true} />
			</div>

			<!-- Select Project -->
			<div class="flex w-full flex-col gap-2">
				<span class="text-sm">소속 프로젝트 선택</span>
				<ProjectSelect bind:projectId />
			</div>

			<!-- Submit button -->
			<Button
				class="w-full"
				type="button"
				filled
				onclick={async () => {
					await createTask();
					onOpenChange?.(false);
					await invalidateAll();
				}}
			>
				생성
			</Button>
		</div>
	{/snippet}
</Dialog>
