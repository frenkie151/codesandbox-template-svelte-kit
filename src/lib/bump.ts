// Svelte action: plays the springy "bump" animation whenever the passed value changes.
export function bump(node: HTMLElement, value: unknown) {
	let prev = value;
	return {
		update(next: unknown) {
			if (next !== prev) {
				node.classList.remove('bump');
				void node.offsetWidth;
				node.classList.add('bump');
			}
			prev = next;
		}
	};
}
