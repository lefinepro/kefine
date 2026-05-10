<script lang="ts">
  let {
    title,
    author,
    backHref,
    onBack
  }: {
    title: string;
    author: string;
    backHref: string;
    onBack: (event: MouseEvent) => void;
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
</lef-solver-topbar>

<style>
  lef-solver-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.75rem;
    border-bottom: 1px solid var(--kef-line-soft);
    background: var(--kef-bg-card);
  }

  .lef-back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    border-radius: 0.5rem;
    color: var(--lefine-text-soft);
    text-decoration: none;
    font-size: 0.85rem;
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
    flex-direction: column;
    align-items: flex-end;
    gap: 0.15rem;
    min-width: 0;
  }

  lef-solver-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--lefine-text);
    line-height: 1.2;
  }

  lef-solver-author {
    font-size: 0.78rem;
    color: var(--kef-primary);
    font-weight: 600;
  }

  @media (max-width: 900px) {
    lef-solver-topbar {
      padding: 0.85rem 1rem;
    }
  }
</style>
