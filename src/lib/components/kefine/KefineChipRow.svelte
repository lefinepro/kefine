<script lang="ts">
  let {
    wrap = true,
    ariaLabel,
    children
  }: {
    wrap?: boolean;
    ariaLabel?: string;
    children?: import('svelte').Snippet;
  } = $props();
</script>

<kefine-chip-row class="kefine-chip-row" class:kefine-chip-row--nowrap={!wrap} aria-label={ariaLabel}>
  {@render children?.()}
</kefine-chip-row>

<style>
  .kefine-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem;
    align-items: center;
  }

  .kefine-chip-row--nowrap {
    flex-wrap: nowrap;
  }
</style>
