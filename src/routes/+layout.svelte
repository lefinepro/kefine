<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();

	// Initialize AppKit in browser only — must be imported at layout level
	// so it's available before any component tries to use it.
	if (browser) {
		import('$lib/auth/appkit.js');
	}
</script>

{@render children()}
