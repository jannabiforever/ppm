<script lang="ts">
	import Button from '../ui/Button.svelte';
	import DatePicker from '../ui/DatePicker.svelte';
	import Dialog from '../ui/Dialog.svelte';
	import ProjectSelect from '../project/ProjectSelect.svelte';
	import TextInput from '../ui/TextInput.svelte';
	import { DateTime, Effect, Layer } from 'effect';
	import { FetchHttpClient } from '@effect/platform';
	import { Task } from '$lib/modules';
	import { invalidateAll } from '$app/navigation';
	import { Separator } from 'bits-ui';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		task: typeof Task.TaskSchema.Type;
	};

	let { open = $bindable(), onOpenChange, task }: Props = $props();

	let title = $state(task.title);
	let description = $state(task.description ?? '');
	let plannedFor = $state<DateTime.Utc | null>(task.planned_for);
	let projectId = $state(task.project_id);

	let plannedForString = $derived.by(() => {
		if (!plannedFor) return null;
		return DateTime.formatIso(plannedFor);
	});

	async function updateTask(): Promise<void> {
		const programResources = Layer.provide(Task.ApiService.Default, FetchHttpClient.layer);
		await Effect.gen(function* () {
			const s = yield* Task.ApiService;
			return yield* s.updateTask(task.id, {
				title,
				description,
				project_id: projectId,
				planned_for: plannedForString
			});
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog title="태스크 수정하기" bind:open {onOpenChange}>
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

			<Separator.Root class="my-1 h-px bg-surface-950-50" />

			<!-- Select Project -->
			<div class="flex w-full items-center justify-between">
				<span class="text-sm">소속 프로젝트 선택</span>
				<ProjectSelect bind:projectId />
			</div>

			<Separator.Root class="my-1 h-px bg-surface-950-50" />

			<!-- planned_for -->
			<div class="flex w-full items-center justify-between">
				<DatePicker bind:utc={plannedFor} label="작업 날짜 (선택)" afterToday={true} />
			</div>

			<!-- Submit button -->
			<Button
				class="w-full"
				type="button"
				filled
				onclick={async () => {
					await updateTask();
					onOpenChange?.(false);
					await invalidateAll();
				}}
			>
				수정
			</Button>
		</div>
	{/snippet}
</Dialog>
