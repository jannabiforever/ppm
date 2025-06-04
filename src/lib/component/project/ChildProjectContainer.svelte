<script lang="ts">
	let { childProject }: { childProject: App.ChildProject } = $props();
</script>

<div class="card card-hover hover:border">
	<header>
		<div class="flex flex-col">
			{childProject.name}
		</div>
	</header>
	<article class="p-4">
		<ul>
			{#each childProject.taskIds as taskId (taskId)}
				{taskId}
			{/each}
		</ul>
	</article>
</div>
