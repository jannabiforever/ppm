<script lang="ts">
	let curTime = $state(new Date());
	const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
</script>

<div class="mx-auto w-full max-w-6xl p-6">
	<div class="flex items-baseline justify-between">
		<h2 class="h2 relative mb-6">Projects</h2>
		<div class="card">
			<p>{curTime.toLocaleDateString()} {dayMap.at(curTime.getDay()) ?? 'Unknown'}</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6">
		<div class="card">
			<p>System</p>
		</div>
		<div class="card">
			<p>Main Project</p>
		</div>
		<div class="card">
			<p>Sub Project 1</p>
		</div>
		<div class="card">
			<p>Sub Project 2</p>
		</div>
	</div>
</div>
