<script lang="ts">
  import { highlightLine } from '$lib/kefine/solution-highlight';
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

  function lineSign(type: CodeLine['type']): string {
    if (type === 'added') return '+';
    if (type === 'removed') return '−';
    return ' ';
  }

  function ariaLabelFor(type: CodeLine['type']): string {
    if (type === 'added') return 'added line';
    if (type === 'removed') return 'removed line';
    return 'unchanged line';
  }
</script>

<lef-code-editor>
  <SolutionCodeTabs files={files} activeFile={activeFile} onSelect={onSelect} />

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

    <lef-code-scroll>
      <lef-code-body>
        {#each lines as line, index (index)}
          <lef-line
            class="lef-line"
            class:lef-line--added={line.type === 'added'}
            class:lef-line--removed={line.type === 'removed'}
            aria-label={ariaLabelFor(line.type)}
          >
            <lef-line-number aria-hidden="true">{index + 1}</lef-line-number>
            <lef-line-sign aria-hidden="true">{lineSign(line.type)}</lef-line-sign>
            <lef-line-text>{@html highlightLine(line.text || ' ', activeFile)}</lef-line-text>
          </lef-line>
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

  lef-code-scroll {
    overflow: auto;
    background: var(--kef-bg-card);
  }

  lef-code-body {
    display: block;
    padding: 0.65rem 0;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
    line-height: 1.55;
    color: var(--lefine-text);
    min-width: max-content;
  }

  .lef-line {
    display: grid;
    grid-template-columns: 3.4rem 1.2rem 1fr;
    align-items: stretch;
    padding-right: 1rem;
  }

  .lef-line--added {
    background: color-mix(in oklab, var(--kef-success) 12%, transparent);
  }

  .lef-line--removed {
    background: color-mix(in oklab, var(--kef-error) 12%, transparent);
  }

  lef-line-number {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 0.85rem;
    color: color-mix(in oklab, var(--lefine-text-soft) 70%, transparent);
    font-variant-numeric: tabular-nums;
    user-select: none;
    border-right: 1px solid var(--kef-line-soft);
  }

  lef-line-sign {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: color-mix(in oklab, var(--lefine-text-soft) 70%, transparent);
    user-select: none;
  }

  .lef-line--added lef-line-sign {
    color: var(--kef-success);
    font-weight: 700;
  }

  .lef-line--removed lef-line-sign {
    color: var(--kef-error);
    font-weight: 700;
  }

  lef-line-text {
    display: inline-block;
    padding-left: 0.5rem;
    white-space: pre;
  }
</style>
