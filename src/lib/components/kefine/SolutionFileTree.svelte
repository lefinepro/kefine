<script lang="ts">
  type FileEntry = {
    file: string;
    added: number;
    removed: number;
  };

  let {
    files,
    activeFile,
    onSelect
  }: {
    files: FileEntry[];
    activeFile: string;
    onSelect: (file: string) => void;
  } = $props();

  const totalAdded = $derived(files.reduce((sum, f) => sum + f.added, 0));
  const totalRemoved = $derived(files.reduce((sum, f) => sum + f.removed, 0));

  function fileBaseName(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx === -1 ? path : path.slice(idx + 1);
  }
</script>

<lef-file-tree>
  <lef-file-tree-header>
    <lef-text-label>{files.length} {files.length === 1 ? 'change' : 'changes'}</lef-text-label>
    <lef-file-tree-totals>
      {#if totalAdded > 0}
        <lef-text-add>+{totalAdded}</lef-text-add>
      {/if}
      {#if totalRemoved > 0}
        <lef-text-remove>−{totalRemoved}</lef-text-remove>
      {/if}
    </lef-file-tree-totals>
  </lef-file-tree-header>

  <lef-file-tree-list role="list">
    {#each files as entry (entry.file)}
      <button
        type="button"
        class="lef-file-tree-item"
        class:lef-file-tree-item--active={activeFile === entry.file}
        title={entry.file}
        onclick={() => onSelect(entry.file)}
      >
        <lef-file-icon aria-hidden="true">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M3.5 1.5h6L13 5v9.5H3.5z" />
            <path d="M9.5 1.5V5H13" />
          </svg>
        </lef-file-icon>
        <lef-file-name>{fileBaseName(entry.file)}</lef-file-name>
        <lef-file-stats>
          {#if entry.added > 0}
            <lef-text-add-soft>+{entry.added}</lef-text-add-soft>
          {/if}
          {#if entry.removed > 0}
            <lef-text-remove-soft>−{entry.removed}</lef-text-remove-soft>
          {/if}
        </lef-file-stats>
      </button>
    {/each}
  </lef-file-tree-list>
</lef-file-tree>

<style>
  lef-file-tree {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }

  lef-file-tree-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0 0.25rem;
  }

  lef-text-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    color: var(--lefine-text-soft);
  }

  lef-file-tree-totals {
    display: inline-flex;
    gap: 0.4rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.7rem;
    font-weight: 600;
  }

  lef-text-add {
    color: var(--kef-success);
  }

  lef-text-remove {
    color: var(--kef-error);
  }

  lef-file-tree-list {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .lef-file-tree-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.4rem;
    padding: 0.32rem 0.5rem;
    border-radius: 0.4rem;
    background: transparent;
    border: 1px solid transparent;
    color: var(--lefine-text);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.78rem;
    text-align: left;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
    min-width: 0;
  }

  .lef-file-tree-item:hover {
    background: color-mix(in oklab, var(--kef-bg-soft) 80%, transparent);
  }

  .lef-file-tree-item--active {
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
    border-color: var(--kef-line-primary);
    color: var(--kef-primary);
  }

  lef-file-icon {
    display: inline-flex;
    align-items: center;
    color: var(--lefine-text-soft);
    flex: 0 0 auto;
  }

  .lef-file-tree-item--active lef-file-icon {
    color: var(--kef-primary);
  }

  lef-file-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  lef-file-stats {
    display: inline-flex;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    flex: 0 0 auto;
  }

  lef-text-add-soft {
    color: var(--kef-success);
    opacity: 0.85;
  }

  lef-text-remove-soft {
    color: var(--kef-error);
    opacity: 0.85;
  }
</style>
