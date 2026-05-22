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
</script>

<lef-tabs role="tablist" aria-label="Modified files">
  {#each files as entry (entry.file)}
    <button
      type="button"
      role="tab"
      aria-selected={activeFile === entry.file}
      class="lef-tab"
      class:lef-tab--active={activeFile === entry.file}
      onclick={() => onSelect(entry.file)}
    >
      <lef-tab-name>{entry.file}</lef-tab-name>
    </button>
  {/each}
</lef-tabs>

<style>
  lef-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0;
    overflow-x: hidden;
    position: relative;
    z-index: 1;
  }

  .lef-tab {
    background: transparent;
    border: 1px solid transparent;
    border-bottom: 2px solid transparent;
    border-radius: 0.5rem 0.5rem 0 0;
    padding: 0.45rem 0.85rem;
    margin-bottom: -2px;
    color: var(--lefine-text-soft);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
    white-space: nowrap;
  }

  .lef-tab:hover {
    color: var(--lefine-text);
    background: color-mix(in oklab, var(--kef-bg-soft) 60%, transparent);
  }

  .lef-tab--active {
    color: var(--kef-primary);
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-bottom: 2px solid var(--kef-bg-card);
    margin-bottom: -2px;
    padding-bottom: 0.46rem;
    font-weight: 600;
    position: relative;
    z-index: 2;
  }

  lef-tab-name {
    display: inline-block;
  }
</style>
