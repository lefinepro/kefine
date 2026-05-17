<script lang="ts">
  import { highlightLines } from '$lib/kefine/solution-highlight';
  import SolutionCodeTabs from './SolutionCodeTabs.svelte';

  type CodeLine = {
    text: string;
    type: 'added' | 'removed' | 'unchanged';
  };

  type FileEntry = {
    file: string;
    added: number;
    removed: number;
  };

  type SideRow = {
    text: string;
    html: string;
    type: 'added' | 'removed' | 'unchanged' | 'empty';
    number: number | null;
  };

  type DiffRow = {
    left: SideRow;
    right: SideRow;
    band: 'added' | 'removed' | 'modified' | null;
  };

  let {
    activeFile,
    files,
    lines,
    onSelect
  }: {
    activeFile: string;
    files: FileEntry[];
    lines: CodeLine[];
    onSelect: (file: string) => void;
  } = $props();

  const activeStats = $derived(files.find(f => f.file === activeFile));

  let leftHtmlLines = $state<string[]>([]);
  let rightHtmlLines = $state<string[]>([]);
  let isLoading = $state(false);

  async function updateHighlightedLines() {
    isLoading = true;
    const oldTexts: string[] = [];
    const newTexts: string[] = [];
    for (const line of lines) {
      if (line.type === 'added') {
        newTexts.push(line.text);
      } else if (line.type === 'removed') {
        oldTexts.push(line.text);
      } else {
        oldTexts.push(line.text);
        newTexts.push(line.text);
      }
    }
    const [left, right] = await Promise.all([
      highlightLines(oldTexts, activeFile),
      highlightLines(newTexts, activeFile)
    ]);
    leftHtmlLines = left;
    rightHtmlLines = right;
    isLoading = false;
  }

  $effect(() => {
    void activeFile;
    void lines;
    updateHighlightedLines();
  });

  function buildRows(): DiffRow[] {
    const lefts: SideRow[] = [];
    const rights: SideRow[] = [];
    let lIdx = 0;
    let rIdx = 0;
    let lNum = 0;
    let rNum = 0;
    for (const line of lines) {
      if (line.type === 'added') {
        rNum += 1;
        lefts.push({ text: '', html: '', type: 'empty', number: null });
        rights.push({ text: line.text, html: rightHtmlLines[rIdx] ?? '', type: 'added', number: rNum });
        rIdx += 1;
      } else if (line.type === 'removed') {
        lNum += 1;
        lefts.push({ text: line.text, html: leftHtmlLines[lIdx] ?? '', type: 'removed', number: lNum });
        rights.push({ text: '', html: '', type: 'empty', number: null });
        lIdx += 1;
      } else {
        lNum += 1;
        rNum += 1;
        lefts.push({ text: line.text, html: leftHtmlLines[lIdx] ?? '', type: 'unchanged', number: lNum });
        rights.push({ text: line.text, html: rightHtmlLines[rIdx] ?? '', type: 'unchanged', number: rNum });
        lIdx += 1;
        rIdx += 1;
      }
    }
    const out: DiffRow[] = [];
    for (let i = 0; i < lefts.length; i += 1) {
      const left = lefts[i];
      const right = rights[i];
      let band: DiffRow['band'] = null;
      if (left.type === 'empty' && right.type === 'added') band = 'added';
      else if (left.type === 'removed' && right.type === 'empty') band = 'removed';
      else if (left.type === 'removed' && right.type === 'added') band = 'modified';
      out.push({ left, right, band });
    }
    return out;
  }

  const rows = $derived.by<DiffRow[]>(() => {
    return buildRows();
  });

  function ariaLabelFor(type: SideRow['type']): string {
    if (type === 'added') return 'added line';
    if (type === 'removed') return 'removed line';
    if (type === 'empty') return 'no corresponding line';
    return 'unchanged line';
  }
</script>

<lef-code-editor>
  {#if isLoading}
    <lef-loading>Highlighting code...</lef-loading>
  {/if}
  <SolutionCodeTabs {files} {activeFile} {onSelect} />

  <lef-code-frame>
    <lef-code-toolbar>
      <lef-code-path>{activeFile}</lef-code-path>
      {#if activeStats}
        <lef-code-stats>
          {#if activeStats.added > 0}
            <lef-text-add>+{activeStats.added}</lef-text-add>
          {/if}
          {#if activeStats.removed > 0}
            <lef-text-remove>−{activeStats.removed}</lef-text-remove>
          {/if}
        </lef-code-stats>
      {/if}
    </lef-code-toolbar>

    <lef-code-headers aria-hidden="true">
      <lef-code-header-cell>Original</lef-code-header-cell>
      <lef-code-header-cell>Modified</lef-code-header-cell>
    </lef-code-headers>

    <lef-code-scroll>
      <lef-code-body>
        {#each rows as row, index (index)}
          <lef-diff-row class:lef-diff-row--changed={row.band !== null}>
            <lef-side
              class="lef-side lef-side--left"
              class:lef-side--removed={row.left.type === 'removed'}
              class:lef-side--empty={row.left.type === 'empty'}
              aria-label={ariaLabelFor(row.left.type)}
            >
              <lef-line-number aria-hidden="true">{row.left.number ?? ''}</lef-line-number>
              <lef-line-text>{#if row.left.type === 'empty'}<lef-text-placeholder aria-hidden="true">&nbsp;</lef-text-placeholder>{:else}{@html row.left.html || '&nbsp;'}{/if}</lef-line-text>
            </lef-side>

            <lef-side
              class="lef-side lef-side--right"
              class:lef-side--added={row.right.type === 'added'}
              class:lef-side--empty={row.right.type === 'empty'}
              aria-label={ariaLabelFor(row.right.type)}
            >
              <lef-line-number aria-hidden="true">{row.right.number ?? ''}</lef-line-number>
              <lef-line-text>{#if row.right.type === 'empty'}<lef-text-placeholder aria-hidden="true">&nbsp;</lef-text-placeholder>{:else}{@html row.right.html || '&nbsp;'}{/if}</lef-line-text>
            </lef-side>
          </lef-diff-row>
        {/each}
      </lef-code-body>
    </lef-code-scroll>
  </lef-code-frame>
</lef-code-editor>

<style>
  lef-code-editor {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }

  lef-loading {
    padding: 1rem;
    text-align: center;
    color: var(--lefine-text-soft);
    font-size: 0.85rem;
  }

  lef-code-frame {
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0 0.6rem 0.6rem 0.6rem;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  lef-code-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.85rem;
    border-bottom: 1px solid var(--kef-line-soft);
    background: color-mix(in oklab, var(--kef-bg-soft) 70%, var(--kef-bg-card));
  }

  lef-code-path {
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.78rem;
    color: var(--lefine-text-soft);
  }

  lef-code-stats {
    display: inline-flex;
    gap: 0.5rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.74rem;
    font-weight: 600;
  }

  lef-text-add { color: var(--kef-success); }
  lef-text-remove { color: var(--kef-error); }

  lef-code-headers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-bottom: 1px solid var(--kef-line-soft);
    background: color-mix(in oklab, var(--kef-bg-soft) 50%, var(--kef-bg-card));
  }

  lef-code-header-cell {
    display: block;
    padding: 0.4rem 0.85rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--lefine-text-soft);
    border-right: 1px solid var(--kef-line-soft);
  }
  lef-code-header-cell:last-child {
    border-right: none;
  }

  lef-code-scroll {
    overflow: auto;
    background: var(--kef-bg-card);
  }

  lef-code-body {
    display: block;
    padding: 0;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--lefine-text);
  }

  lef-diff-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }

  .lef-side {
    display: grid;
    grid-template-columns: 3rem 1fr;
    align-items: stretch;
    padding-right: 0.75rem;
    border-right: 1px solid var(--kef-line-soft);
    min-width: 0;
  }
  .lef-side--right {
    border-right: none;
  }

  .lef-side--added {
    background: color-mix(in oklab, var(--kef-success) 22%, transparent);
  }
  .lef-side--removed {
    background: color-mix(in oklab, var(--kef-error) 22%, transparent);
  }
  .lef-side--empty {
    background: color-mix(in oklab, var(--lefine-text-soft) 8%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) .lef-side--added {
    background: color-mix(in oklab, var(--kef-success) 28%, transparent);
  }
  :global(:root[data-kefine-theme='dark']) .lef-side--removed {
    background: color-mix(in oklab, var(--kef-error) 28%, transparent);
  }
  :global(:root[data-kefine-theme='dark']) .lef-side--empty {
    background: color-mix(in oklab, #ffffff 4%, transparent);
  }

  lef-line-number {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 0.65rem;
    color: color-mix(in oklab, var(--lefine-text-soft) 70%, transparent);
    font-variant-numeric: tabular-nums;
    user-select: none;
    border-right: 1px solid var(--kef-line-soft);
    background: color-mix(in oklab, var(--kef-bg-soft) 35%, transparent);
  }

  .lef-side--added lef-line-number {
    color: var(--kef-success);
    background: color-mix(in oklab, var(--kef-success) 10%, var(--kef-bg-card));
  }
  .lef-side--removed lef-line-number {
    color: var(--kef-error);
    background: color-mix(in oklab, var(--kef-error) 10%, var(--kef-bg-card));
  }

  lef-line-text {
    display: block;
    padding-left: 0.65rem;
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  lef-text-placeholder {
    display: inline-block;
    width: 100%;
    height: 1.55em;
  }

  @media (max-width: 900px) {
    lef-diff-row {
      grid-template-columns: 1fr;
    }
    .lef-side {
      border-right: none;
      border-bottom: 1px solid var(--kef-line-soft);
    }
    lef-code-headers {
      display: none;
    }
  }
</style>
