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
    padding: 0 0 0.5rem;
    border-bottom: 1px solid var(--kef-line-soft);
    overflow-x: auto;
  }

  .lef-tab {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.5rem 0.5rem 0 0;
    padding: 0.45rem 0.85rem;
    color: var(--lefine-text-soft);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
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
    border-color: var(--kef-line);
    border-bottom-color: var(--kef-bg-card);
    margin-bottom: -1px;
    font-weight: 600;
  }

  lef-tab-name {
    display: inline-block;
  }
</style>
