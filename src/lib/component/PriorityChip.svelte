<script lang="ts">
	let { priority }: { priority: App.PriorityLevel } = $props();

	const getPriorityChipPreset = (priority: App.PriorityLevel) => {
		switch (priority) {
			case 'system':
				return 'preset-filled-primary-500';
			case 'high':
				return 'preset-filled-error-500';
			case 'medium':
				return 'preset-filled-warning-500';
			case 'low':
				return 'preset-filled-surface-500';
		}
	};

	const priorityChipPreset = $derived(getPriorityChipPreset(priority));
</script>

<span class="chip capitalize {priorityChipPreset}">{priority}</span>
