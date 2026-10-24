<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
		labelledby: string;
		header?: Snippet;
		footer: Snippet;
		children: Snippet;
	}

	// Bottom sheet with a grabber. Drag the grabber or header down to dismiss.
	let { open, onclose, labelledby, header, footer, children }: Props = $props();
	let el: HTMLDivElement;
	let drag: { y0: number; dy: number } | null = null;
	let offset = $state<number | null>(null);

	$effect(() => {
		if (!open) return;
		const t = setTimeout(
			() =>
				el
					.querySelector<HTMLElement>('.sheet-foot .btn:not(.ghost)')
					?.focus({ preventScroll: true }),
			420
		);
		return () => clearTimeout(t);
	});

	function down(e: PointerEvent & { currentTarget: HTMLElement }) {
		if ((e.target as HTMLElement).closest('button')) return;
		drag = { y0: e.clientY, dy: 0 };
		offset = 0;
		e.currentTarget.setPointerCapture(e.pointerId);
	}
	function move(e: PointerEvent) {
		if (!drag) return;
		const dy = e.clientY - drag.y0;
		drag.dy = dy;
		offset = dy > 0 ? dy : dy / 6;
	}
	function up() {
		if (!drag) return;
		const { dy } = drag;
		drag = null;
		offset = null;
		if (dy > 110) onclose();
	}
</script>

<div
	bind:this={el}
	class="sheet"
	class:show={open}
	class:dragging={offset !== null}
	style:transform={offset !== null ? `translateY(${offset}px)` : null}
	role="dialog"
	aria-modal="true"
	aria-labelledby={labelledby}
	inert={!open}
>
	<div
		class="grab"
		aria-hidden="true"
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
	></div>
	{#if header}
		<div
			class="sheet-h"
			role="presentation"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		>
			{@render header()}
		</div>
	{/if}
	<div class="sheet-body" style:padding-top={header ? null : '6px'}>{@render children()}</div>
	<div class="sheet-foot">{@render footer()}</div>
</div>
