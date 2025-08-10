<script lang="ts">
	import icon_screen from '$lib/assets/icon-screen.svg';
	let { children } = $props();
</script>

<div class="fixed top-0 left-0 h-full w-1/2">
	{@render children?.()}
</div>
<div
	class="fixed top-0 right-0 flex h-full w-1/2 items-center justify-center p-24"
	id="right-panel-pic"
>
	<img src={icon_screen} alt="PPM" />
</div>

<style>
	#right-panel-pic {
		background: linear-gradient(to right bottom, var(--color-surface-50), var(--color-surface-100));
	}
</style>
