<script lang="ts">
	let { on, label, onchange }: { on: boolean; label: string; onchange: () => void } = $props();
</script>

<button class="toggle" role="switch" aria-checked={on} aria-label={label} onclick={onchange}
></button>
