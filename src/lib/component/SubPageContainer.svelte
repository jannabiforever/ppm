<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, children }: { title: string; children: Snippet } = $props();

	let curTime = $state(new Date());
	const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
</script>

<div class="mx-auto w-full max-w-6xl p-6">
	<div class="flex items-baseline justify-between">
		<h2 class="h2 relative mb-6">{title}</h2>
		<div class="card">
			<p>{curTime.toLocaleDateString()} {dayMap.at(curTime.getDay()) ?? 'Unknown'}</p>
		</div>
	</div>

	{@render children()}
</div>
