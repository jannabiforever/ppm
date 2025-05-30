<script lang="ts">
	import SubPageContainer from '$lib/component/SubPageContainer.svelte';

	let { children } = $props();
</script>

<SubPageContainer title="Notes">
	{@render children()}
</SubPageContainer>
