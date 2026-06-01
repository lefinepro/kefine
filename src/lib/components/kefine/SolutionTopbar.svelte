<script lang="ts">
  let {
    title,
    author,
    project,
    slug,
    backHref,
    onBack,
    onMerge,
    isMerged = false,
    isMerging = false
  }: {
    title: string;
    author: string;
    project?: string;
    slug?: string;
    backHref: string;
    onBack: (event: MouseEvent) => void;
    onMerge?: () => void;
    isMerged?: boolean;
    isMerging?: boolean;
  } = $props();
</script>

<lef-solver-topbar>
  <a class="lef-back-link" href={backHref} onclick={onBack} aria-label="Back to task" title="Back to task">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6"></path>
    </svg>
  </a>

  <lef-solver-meta>
    {#if project}
      <lef-solver-crumb class="lef-solver-crumb--project">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h6.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12c.281.282.439.664.439 1.061V13.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 13.5v-11Z"></path>
        </svg>
        <lefine-text>{project}</lefine-text>
      </lef-solver-crumb>
    {/if}
    {#if slug}
      <lef-solver-crumb class="lef-solver-crumb--slug">
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="5" cy="3.5" r="1.5"></circle>
          <circle cx="5" cy="12.5" r="1.5"></circle>
          <circle cx="11.5" cy="8" r="1.5"></circle>
          <path d="M5 5v6"></path>
          <path d="M5 8h3a3 3 0 0 0 3-3"></path>
        </svg>
        <lefine-text>{slug}</lefine-text>
      </lef-solver-crumb>
    {/if}
    <lef-solver-separator aria-hidden="true">/</lef-solver-separator>
    <lef-solver-title-row>
      <lef-solver-status aria-hidden="true">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm3.78 5.97a.75.75 0 0 0-1.06-1.06L7 8.63 5.28 6.91a.75.75 0 1 0-1.06 1.06l2.25 2.25c.293.293.767.293 1.06 0l4.25-4.25Z"></path>
        </svg>
      </lef-solver-status>
      <lef-solver-title>{title}</lef-solver-title>
      <lef-solver-author>{author}</lef-solver-author>
    </lef-solver-title-row>
  </lef-solver-meta>

  {#if onMerge}
    <button
      type="button"
      class="lef-merge-btn"
      class:lef-merge-btn--merged={isMerged}
      onclick={onMerge}
      disabled={isMerged || isMerging}
      aria-label={isMerged ? 'Applied' : 'Apply solution'}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="6" cy="18" r="2"></circle>
        <circle cx="6" cy="6" r="2"></circle>
        <circle cx="18" cy="14" r="2"></circle>
        <path d="M6 8v8M6 8c0 4 6 6 12 6"></path>
      </svg>
      <lefine-text>{isMerged ? 'Applied' : 'Apply'}</lefine-text>
    </button>
  {/if}
</lef-solver-topbar>

<style>
  lef-solver-topbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.25rem;
    border-bottom: 1px solid var(--kef-line-soft);
    background: var(--kef-bg-card);
    min-height: 44px;
  }

  .lef-back-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 0.4rem;
    border: 1px solid var(--kef-line-soft);
    color: var(--lefine-text-soft);
    text-decoration: none;
    background: var(--kef-bg-soft);
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft);
    flex: 0 0 auto;
  }

  .lef-back-link:hover {
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    border-color: var(--kef-line);
  }

  lef-solver-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex: 1;
    overflow: hidden;
    margin-left: 0.25rem;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  lef-solver-crumb {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--lefine-text-soft);
    flex: 0 0 auto;
    line-height: 1.4;
  }

  lef-solver-crumb svg {
    flex: 0 0 auto;
  }

  lef-solver-crumb lefine-text {
    font-weight: 500;
    font-size: 0.85rem;
    line-height: 1.4;
  }

  lef-solver-crumb.lef-solver-crumb--slug {
    color: var(--kef-color-primary, var(--kef-primary));
  }

  lef-solver-separator {
    color: color-mix(in oklab, var(--lefine-text-soft) 60%, transparent);
    font-size: 0.85rem;
    line-height: 1.4;
    flex: 0 0 auto;
  }

  lef-solver-title-row {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    overflow: hidden;
    line-height: 1.4;
  }

  lef-solver-status {
    display: inline-flex;
    align-items: center;
    color: var(--kef-success, #16a34a);
    flex: 0 0 auto;
  }

  lef-solver-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--lefine-text);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  lef-solver-author {
    font-size: 0.85rem;
    color: var(--kef-color-primary, var(--kef-primary));
    font-weight: 600;
    line-height: 1.4;
    flex: 0 0 auto;
  }

  .lef-merge-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.85rem;
    border-radius: 0.25rem;
    border: 1px solid #3f7a52;
    background: #3f7a52;
    color: var(--kef-on-primary, #ffffff);
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
    background: #326643;
    border-color: #326643;
  }

  .lef-merge-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .lef-merge-btn:disabled {
    cursor: not-allowed;
    opacity: 0.85;
  }

  .lef-merge-btn--merged {
    background: #3f7a52;
    border-color: #3f7a52;
  }

  @media (max-width: 900px) {
    lef-solver-topbar {
      padding: 0.6rem 0.85rem;
      gap: 0.4rem;
    }
    lef-solver-meta {
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    lef-solver-separator {
      display: none;
    }
  }
</style>
