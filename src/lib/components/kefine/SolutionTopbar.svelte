<script lang="ts">
  let {
    title,
    author,
    backHref,
    onBack,
    onMerge,
    isMerged = false,
    isMerging = false
  }: {
    title: string;
    author: string;
    backHref: string;
    onBack: (event: MouseEvent) => void;
    onMerge?: () => void;
    isMerged?: boolean;
    isMerging?: boolean;
  } = $props();
</script>

<lef-solver-topbar>
  <a class="lef-back-link" href={backHref} onclick={onBack}>
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7"></path>
    </svg>
    <lef-text-back>Back to solutions</lef-text-back>
  </a>

  <lef-solver-meta>
    <lef-solver-title>{title}</lef-solver-title>
    <lef-solver-author>{author}</lef-solver-author>
  </lef-solver-meta>

  {#if onMerge}
    <button
      type="button"
      class="lef-merge-btn"
      class:lef-merge-btn--merged={isMerged}
      onclick={onMerge}
      disabled={isMerged || isMerging}
      aria-label={isMerged ? 'Merged' : 'Merge solution'}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="2"></circle>
        <circle cx="6" cy="6" r="2"></circle>
        <circle cx="18" cy="14" r="2"></circle>
        <path d="M6 8v8M6 8c0 4 6 6 12 6"></path>
      </svg>
      <lefine-text>{isMerged ? 'Merged' : 'Merge'}</lefine-text>
    </button>
  {/if}
</lef-solver-topbar>

<style>
  lef-solver-topbar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 1.5rem;
    border-bottom: 1px solid var(--kef-line-soft);
    background: var(--kef-bg-card);
  }

  .lef-back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.55rem;
    border-radius: 0.4rem;
    color: var(--lefine-text-soft);
    text-decoration: none;
    font-size: 0.8rem;
    font-weight: 500;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .lef-back-link:hover {
    background: var(--kef-bg-soft);
    color: var(--lefine-text);
  }

  lef-solver-meta {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    margin-left: 0.5rem;
  }

  lef-solver-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--lefine-text);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  lef-solver-author {
    font-size: 0.76rem;
    color: var(--kef-primary);
    font-weight: 600;
    flex: 0 0 auto;
  }

  .lef-merge-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.85rem;
    border-radius: 0.4rem;
    border: 1px solid color-mix(in oklab, var(--kef-success, #16a34a) 45%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 12%, var(--kef-bg-card));
    color: var(--kef-success, #16a34a);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      transform 120ms ease;
  }

  .lef-merge-btn:hover:not(:disabled) {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 22%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  .lef-merge-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .lef-merge-btn:disabled {
    cursor: not-allowed;
    opacity: 0.85;
  }

  .lef-merge-btn--merged {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 22%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  @media (max-width: 900px) {
    lef-solver-topbar {
      padding: 0.7rem 0.85rem;
    }
    lef-solver-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
    }
  }
</style>
