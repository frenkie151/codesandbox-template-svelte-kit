<script lang="ts">
	import { icons, type IconName } from '$lib/detention';

	let {
		name,
		class: cls = 'i',
		style
	}: { name: IconName; class?: string; style?: string } = $props();
</script>

<svg class={cls} {style} viewBox="0 0 24 24" aria-hidden="true">{@html icons[name]}</svg>
