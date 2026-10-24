<script lang="ts">
	import type { Snippet } from 'svelte';

	// A tab's scrolling page: large title in the content, compact blurred bar once you scroll past it.
	let {
		id,
		title,
		active,
		children
	}: { id: string; title: string; active: boolean; children: Snippet } = $props();
	let scrolled = $state(false);
</script>

<section
	class="view tabview"
	class:active
	{id}
	aria-label={title}
	inert={!active}
	onscroll={(e) => (scrolled = e.currentTarget.scrollTop > 46)}
>
	<div class="navbar" class:show={scrolled} aria-hidden="true"><h2>{title}</h2></div>
	<div class="content">{@render children()}</div>
</section>
