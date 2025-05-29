<script lang="ts">
	import { Calendar, Clock } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();

	let curTime = $state(new Date());
	const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

	// Format time with leading zeros
	const formatTime = (date: Date): string => {
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	};
</script>

<div class="mx-auto w-full max-w-6xl p-6">
	<div class="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-baseline">
		<div class="flex items-center gap-3">
			<h2 class="h2 font-bold">{title}</h2>
		</div>
		<div class="card variant-soft-surface flex items-center gap-3 p-3 shadow-md">
			<Calendar class="text-primary-500 size-5" />
			<p class="font-medium">
				{curTime.toLocaleDateString()}
				<span class="text-primary-500 font-semibold"
					>{dayMap.at(curTime.getDay()) ?? 'Unknown'}</span
				>
			</p>
			<div class="bg-surface-300 dark:bg-surface-700 mx-1 h-5 w-px"></div>
			<Clock class="text-primary-500 size-5" />
			<p class="font-medium">{formatTime(curTime)}</p>
		</div>
	</div>

	{@render children()}
</div>
