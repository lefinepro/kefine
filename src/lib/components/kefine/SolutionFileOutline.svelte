<script lang="ts">
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

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

  const localeText = $derived($kefineLocaleText);
  const labels = $derived(localeText.solutionView);

  function iconFor(filename: string): 'go' | 'yaml' | 'rust' | 'mod' | 'doc' {
    const lower = filename.toLowerCase();
    if (lower.endsWith('go.mod')) return 'mod';
    if (lower.endsWith('.go')) return 'go';
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
    if (lower.endsWith('.rs')) return 'rust';
    return 'doc';
  }
</script>

<lef-file-outline aria-label={labels.modifiedFilesOutline}>
  <lef-file-outline-head>
    <strong>{labels.files}</strong>
    <lefine-text>{files.length}</lefine-text>
  </lef-file-outline-head>
  <lef-file-outline-list role="list">
    {#each files as entry (entry.file)}
      <button
        type="button"
        class="lef-file-outline-item"
        class:lef-file-outline-item--active={activeFile === entry.file}
        onclick={() => onSelect(entry.file)}
        aria-current={activeFile === entry.file ? 'true' : undefined}
        title={entry.file}
      >
        <lef-file-outline-glyph data-kind={iconFor(entry.file)} aria-hidden="true"></lef-file-outline-glyph>
        <lef-file-outline-name>{entry.file}</lef-file-outline-name>
        <lef-file-outline-stats>
          {#if entry.added > 0}
            <lef-file-outline-add>+{entry.added}</lef-file-outline-add>
          {/if}
          {#if entry.removed > 0}
            <lef-file-outline-rem>−{entry.removed}</lef-file-outline-rem>
          {/if}
        </lef-file-outline-stats>
      </button>
    {/each}
  </lef-file-outline-list>
</lef-file-outline>

<style>
  lef-file-outline {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.7rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.6rem;
    min-width: 0;
  }

  lef-file-outline-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-file-outline-head strong {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--lefine-text-soft);
    font-weight: 700;
  }

  lef-file-outline-head lefine-text {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    font-variant-numeric: tabular-nums;
  }

  lef-file-outline-list {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .lef-file-outline-item {
    appearance: none;
    display: grid;
    grid-template-columns: 0.85rem 1fr auto;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 0.4rem;
    padding: 0.35rem 0.45rem;
    color: var(--lefine-text-soft);
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease);
  }

  .lef-file-outline-item:hover {
    background: color-mix(in oklab, var(--kef-bg-soft) 70%, transparent);
    color: var(--lefine-text);
  }

  .lef-file-outline-item--active {
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 14%, transparent);
    color: var(--lefine-text);
  }

  lef-file-outline-glyph {
    display: inline-block;
    width: 0.85rem;
    height: 0.85rem;
    border-radius: 2px;
    background: color-mix(in oklab, var(--lefine-text-soft) 35%, transparent);
  }

  lef-file-outline-glyph[data-kind='go'] { background: #00add8; }
  lef-file-outline-glyph[data-kind='mod'] { background: #79b8ff; }
  lef-file-outline-glyph[data-kind='yaml'] { background: #cb171e; }
  lef-file-outline-glyph[data-kind='rust'] { background: #dea584; }
  lef-file-outline-glyph[data-kind='doc'] { background: color-mix(in oklab, var(--lefine-text-soft) 55%, transparent); }

  lef-file-outline-name {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  lef-file-outline-stats {
    display: inline-flex;
    gap: 0.35rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.7rem;
    font-weight: 700;
  }

  lef-file-outline-add { color: var(--kef-success, #16a34a); }
  lef-file-outline-rem { color: var(--kef-error, #c65353); }
</style>
