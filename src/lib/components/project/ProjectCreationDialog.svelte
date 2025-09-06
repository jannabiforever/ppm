<script lang="ts">
	import { Project } from '$lib/modules';
	import { FetchHttpClient } from '@effect/platform';
	import { Effect, Layer } from 'effect';
	import Dialog from '../ui/Dialog.svelte';
	import Button from '../ui/Button.svelte';
	import { invalidateAll } from '$app/navigation';
	import TextInput from '../ui/TextInput.svelte';

	type Props = {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
	};

	let { open = $bindable(), onOpenChange = () => {} }: Props = $props();

	let name = $state('');
	let description = $state('');

	async function createProject(): Promise<{ id: string }> {
		const programResources = Layer.provide(Project.ApiService.Default, FetchHttpClient.layer);
		return await Effect.gen(function* () {
			const pService = yield* Project.ApiService;
			return yield* pService.createProject({
				name,
				description
			});
		}).pipe(Effect.provide(programResources), Effect.runPromise);
	}
</script>

<Dialog
	title="새 프로젝트 생성하기"
	bind:open
	description="tip: 2-3개월 이내에 마무리 지을 수 있는 단위의 마일스톤을 설정하세요."
>
	{#snippet content()}
		<div class="flex w-full flex-col gap-3">
			<div class="w-full">
				<TextInput name="name" bind:value={name} placeholder="프로젝트 이름" label="이름" />
			</div>
			<div class="w-full">
				<TextInput
					name="description"
					bind:value={description}
					placeholder="프로젝트의 목표, 달성 요건, 마일스톤 등"
					label="설명"
				/>
			</div>
			<div class="flex w-full flex-col gap-3">
				<Button
					class="w-full"
					type="button"
					filled
					onclick={async () => {
						await createProject();
						onOpenChange?.(false);
						await invalidateAll();
					}}
				>
					생성
				</Button>
			</div>
		</div>
	{/snippet}
</Dialog>
