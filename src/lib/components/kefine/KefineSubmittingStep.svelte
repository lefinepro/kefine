<script lang="ts">
  import KefineLoadingDocuments from '$lib/components/kefine/KefineLoadingDocuments.svelte';

  let {
    ariaLabel = 'Forwarding document to server'
  }: {
    ariaLabel?: string;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide kefine-submitting-card" aria-busy="true" aria-label={ariaLabel}>
  <KefineLoadingDocuments {ariaLabel} />
</article>

<style>
  .kefine-submitting-card {
    display: grid;
    place-items: center;
    width: 100%;
    min-height: min(24rem, 52vh);
    padding: clamp(1.5rem, 3vw, 2.3rem);
    background: transparent;
    border: 0;
    box-shadow: none;
    overflow: hidden;
  }
</style>
