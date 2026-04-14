<script lang="ts">
  let {
    type = 'button',
    dashed = false,
    ariaLabel,
    title,
    disabled = false,
    onclick,
    children
  }: {
    type?: 'button' | 'submit' | 'reset';
    dashed?: boolean;
    ariaLabel?: string;
    title?: string;
    disabled?: boolean;
    onclick?: (event: MouseEvent) => void;
    children?: import('svelte').Snippet;
  } = $props();
</script>

<button
  {type}
  data-dashed={dashed}
  aria-label={ariaLabel}
  {title}
  {disabled}
  {onclick}
>
  {@render children?.()}
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.2rem;
    padding: 0.4rem 0.82rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 10%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card) 88%, transparent);
    color: inherit;
    flex: 0 0 auto;
    font: inherit;
  }

  button[data-dashed='true'] {
    border-style: dashed;
  }

</style>
