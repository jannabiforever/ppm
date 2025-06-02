<script lang="ts">
	import type { PageProps } from './$types';
	import ProjectList from '$lib/component/project/ProjectList.svelte';

	let { data, form }: PageProps = $props();
</script>

<ProjectList {data} {form} />
