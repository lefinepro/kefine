<script lang="ts">
  let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<kefine-chip-editor-row>
  {@render children?.()}
</kefine-chip-editor-row>

<style>
  kefine-chip-editor-row {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  kefine-chip-editor-row :global(input),
  kefine-chip-editor-row :global(select) {
    width: 100%;
    min-height: 2.6rem;
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-radius: 0;
    padding-left: 0;
    padding-right: 0;
    background: transparent;
    box-shadow: none;
  }

  @media (max-width: 980px) {
    kefine-chip-editor-row {
      grid-template-columns: 1fr;
    }
  }
</style>
