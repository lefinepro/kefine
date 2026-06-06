<script lang="ts">
  import Icon from '@iconify/svelte';
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
  let searchOpen = $state(false);
  let searchQuery = $state('');
  let searchInput = $state<HTMLInputElement | null>(null);

  const normalizedSearchQuery = $derived(searchQuery.trim().toLowerCase());
  const visibleFiles = $derived(
    normalizedSearchQuery
      ? files.filter((entry) => entry.file.toLowerCase().includes(normalizedSearchQuery))
      : files
  );

  $effect(() => {
    if (searchOpen) {
      searchInput?.focus();
    }
  });

  function iconFor(filename: string): 'go' | 'yaml' | 'rust' | 'mod' | 'doc' {
    const lower = filename.toLowerCase();
    if (lower.endsWith('go.mod')) return 'mod';
    if (lower.endsWith('.go')) return 'go';
    if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
    if (lower.endsWith('.rs')) return 'rust';
    return 'doc';
  }

  function toggleSearch() {
    searchOpen = !searchOpen;
    if (!searchOpen) {
      searchQuery = '';
    }
  }

  function clearSearch() {
    searchQuery = '';
    searchInput?.focus();
  }
</script>

<lef-file-outline aria-label={labels.modifiedFilesOutline}>
  <lef-file-outline-head>
    <lef-file-outline-title>
      <strong>{labels.files}</strong>
      <lefine-text>{visibleFiles.length}</lefine-text>
    </lef-file-outline-title>
    <button
      type="button"
      class="lef-file-search-toggle"
      data-testid="solution-file-search-trigger"
      aria-label={labels.fileSearch}
      aria-expanded={searchOpen}
      title={labels.fileSearch}
      onclick={toggleSearch}
    >
      <Icon icon={searchOpen ? 'lucide:x' : 'lucide:search'} width="14" height="14" aria-hidden="true" />
    </button>
  </lef-file-outline-head>

  {#if searchOpen}
    <lef-file-search>
      <Icon icon="lucide:search" width="13" height="13" aria-hidden="true" />
      <input
        bind:this={searchInput}
        data-testid="solution-file-search-input"
        value={searchQuery}
        placeholder={labels.fileSearchPlaceholder}
        aria-label={labels.fileSearch}
        oninput={(event) => (searchQuery = (event.currentTarget as HTMLInputElement).value)}
      />
      {#if searchQuery}
        <button
          type="button"
          data-testid="solution-file-search-clear"
          aria-label={labels.fileSearchClear}
          title={labels.fileSearchClear}
          onclick={clearSearch}
        >
          <Icon icon="lucide:x" width="12" height="12" aria-hidden="true" />
        </button>
      {/if}
    </lef-file-search>
  {/if}

  <lef-file-outline-list role="list">
    {#each visibleFiles as entry (entry.file)}
      <button
        type="button"
        class="lef-file-outline-item"
        data-testid="solution-file-outline-item"
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
    {:else}
      <lef-file-outline-empty data-testid="solution-file-search-empty">
        {labels.fileSearchEmpty}
      </lef-file-outline-empty>
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
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-file-outline-title {
    display: inline-flex;
    align-items: baseline;
    gap: 0.45rem;
    min-width: 0;
  }

  lef-file-outline-title strong {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--lefine-text-soft);
    font-weight: 700;
  }

  lef-file-outline-title lefine-text {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    font-variant-numeric: tabular-nums;
  }

  .lef-file-search-toggle,
  lef-file-search button {
    appearance: none;
    display: inline-grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.4rem;
    background: color-mix(in oklab, var(--kef-bg-card) 76%, var(--kef-bg-soft) 24%);
    color: var(--lefine-text-soft);
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      border-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease);
  }

  .lef-file-search-toggle:hover,
  lef-file-search button:hover {
    color: var(--lefine-text);
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 38%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  .lef-file-search-toggle[aria-expanded='true'] {
    color: var(--lefine-text);
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 40%, var(--kef-line));
  }

  lef-file-search {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.3rem;
    height: 1.75rem;
    min-height: 0;
    padding: 0.1rem 0.3rem;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.4rem;
    background: var(--kef-bg-soft);
    color: var(--lefine-text-soft);
  }

  lef-file-search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    height: 100%;
    min-height: 0;
    padding: 0;
    background: transparent;
    color: var(--lefine-text);
    font: inherit;
    font-size: 0.8rem;
    line-height: 1;
  }

  lef-file-search input::placeholder {
    color: var(--lefine-text-soft);
    opacity: 0.78;
  }

  lef-file-search button {
    width: 1.45rem;
    height: 1.45rem;
    border-radius: 0.35rem;
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

  lef-file-outline-empty {
    display: block;
    padding: 0.45rem;
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
  }
</style>
