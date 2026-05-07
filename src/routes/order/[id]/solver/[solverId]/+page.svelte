<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import hljs from 'highlight.js/lib/core';
  import rust from 'highlight.js/lib/languages/rust';
  import 'highlight.js/styles/xcode.css';
  import { solutionsStore } from '$lib/kefine/solutions-store';
  import { get } from 'svelte/store';

  hljs.registerLanguage('rust', rust);

  let {
    data
  }: {
    data: {
      orderId: string;
      solverId: string;
    };
  } = $props();

  const mockSolutions = [
    {
      id: '1',
      solver: 'Basic Rust Dev',
      title: 'Simple Hello World without comments',
      description: 'Minimal implementation with just the basics',
      diffs: [
        { file: 'src/main.rs', added: 3, removed: 0 }
      ],
      codeLines: [
        { text: 'fn main() {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '2',
      solver: 'Commented Rust Expert',
      title: 'Hello World with detailed comments',
      description: 'Educational version with explanations for each line',
      diffs: [
        { file: 'src/main.rs', added: 10, removed: 0 }
      ],
      codeLines: [
        { text: '// This is the main function - entry point of every Rust program', type: 'added' },
        { text: 'fn main() {', type: 'added' },
        { text: '    // Print a greeting message to the console', type: 'added' },
        { text: '    // println! is a macro that prints to stdout with a newline', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    // The program will exit here', type: 'added' },
        { text: '    // Rust automatically returns () (unit type) from functions', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '3',
      solver: 'Interactive Rust',
      title: 'Interactive Hello World with user input',
      description: 'Reads user input and responds accordingly',
      diffs: [
        { file: 'src/main.rs', added: 12, removed: 0 }
      ],
      codeLines: [
        { text: 'use std::io;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'fn main() {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: "    println!(\"What's your name?\");", type: 'added' },
        { text: '    let mut name = String::new();', type: 'added' },
        { text: '    io::stdin().read_line(&mut name).expect("Failed to read line");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
        { text: '}', type: 'added' }
      ]
    },
    {
      id: '4',
      solver: 'Modern Rust Patterns',
      title: 'Hello World using modern Rust patterns',
      description: 'Uses Result handling and modern syntax',
      diffs: [
        { file: 'src/main.rs', added: 15, removed: 0 }
      ],
      codeLines: [
        { text: 'use std::io::{self, Write};', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: 'fn main() -> Result<(), Box<dyn std::error::Error>> {', type: 'added' },
        { text: '    println!("Hello, world!");', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    print!("Enter your name: ");', type: 'added' },
        { text: '    io::stdout().flush()?;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    let mut name = String::new();', type: 'added' },
        { text: '    io::stdin().read_line(&mut name)?;', type: 'added' },
        { text: '', type: 'unchanged' },
        { text: '    println!("Hello, {}!", name.trim());', type: 'added' },
        { text: '    Ok(())', type: 'added' },
        { text: '}', type: 'added' }
      ]
    }
  ];

let activeFile = $state('main.rs');

  const solution = $derived(get(solutionsStore).find(s => s.id === data.solverId) ?? null);
  const codeLines = $derived(solution?.codeLines ?? []);
  const diffs = $derived(solution?.diffs ?? []);

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      goto(`/order/${data.orderId}`);
    }
  }

  function selectFile(file: string) {
    activeFile = file;
  }

  function highlightLine(line: string): string {
    try {
      return hljs.highlight(line, { language: 'rust' }).value;
    } catch {
      return line;
    }
  }

  onMount(() => {
    hljs.highlightAll();
  });
</script>

<svelte:head>
  <title>{solution ? `${solution.solver} | Lefine` : 'Solution | Lefine'}</title>
</svelte:head>

<div class="solver-page">
  <div class="layout-container">
    <aside class="sidebar">
      <a href="#" class="back-link" onclick={goBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"></path>
        </svg>
        Back to solutions
      </a>

      <div class="solver-header">
        <h1>{solution?.title ?? 'Solution'}</h1>
        <span class="solver-title">{solution?.solver ?? 'Solver'}</span>
        <p class="solver-desc">{solution?.description ?? ''}</p>
      </div>

      <div class="sidebar-section">
        <h3 class="section-title">Modified Files</h3>
        <div class="file-list">
          {#each diffs as diff}
            <button class="file-item" class:active={activeFile === diff.file} onclick={() => selectFile(diff.file)}>
              <span>{diff.file}</span>
              <span class="file-badge">+{diff.added}</span>
            </button>
          {/each}
        </div>
      </div>
    </aside>

    <main class="code-area">
      {#if solution}
        <div class="editor-window">
          <div class="editor-header">
            <div class="editor-controls">
              <div class="dot red"></div>
              <div class="dot yellow"></div>
              <div class="dot green"></div>
            </div>
            <div class="editor-filename">{activeFile}</div>
          </div>

          <div class="code-content">
            {#each codeLines as line, i}
              {#if line.text}
                <div class="code-line" class:added={line.type === 'added'} class:removed={line.type === 'removed'}>
                  <span class="line-number">{i + 1}</span>
                  <span class="line-content">{@html highlightLine(line.text)}</span>
                </div>
              {:else}
                <div class="code-line code-line--empty">
                  <span class="line-number"></span>
                  <span class="line-content"></span>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {:else}
        <p class="not-found">Solution not found</p>
      {/if}
    </main>
  </div>
</div>

<style>
  :root {
    --brand-primary: #c89a5a;
    --brand-gold: #d3a45c;
  }

.solver-page {
    background: var(--kef-bg);
    min-height: 100vh;
  }

  .layout-container {
    display: grid;
    grid-template-columns: 320px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    padding: 32px;
    border-right: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    display: flex;
    flex-direction: column;
    gap: 32px;
    height: 100%;
    overflow-y: auto;
  }

  .layout-container {
    display: grid;
    grid-template-columns: 320px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    padding: 32px;
    border-right: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    display: flex;
    flex-direction: column;
    gap: 32px;
    height: 100%;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--kef-text-soft);
    font-size: 0.9rem;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 8px;
    transition: background 0.2s;
    width: fit-content;
    cursor: pointer;
    border: none;
    background: transparent;
  }

  .back-link:hover {
    background: var(--kef-bg-soft);
    color: var(--kef-text);
  }

  .solver-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .solver-header h1 {
    margin: 0;
    font-size: 1.5rem;
    line-height: 1.3;
    color: var(--kef-text);
  }

  .solver-title {
    font-size: 0.95rem;
    color: var(--kef-primary);
    font-weight: 600;
  }

  .solver-desc {
    font-size: 0.95rem;
    color: var(--kef-text-soft);
    line-height: 1.6;
    margin: 0;
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--kef-text-soft);
    font-weight: 700;
    margin: 0;
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .file-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--kef-bg-card);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85rem;
    color: var(--kef-text);
  }

  .file-item:hover {
    border-color: var(--kef-line);
    background: var(--kef-bg-soft);
  }

  .file-item.active {
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
    border-color: var(--kef-primary);
    color: var(--kef-primary);
  }

  .file-badge {
    font-size: 0.7rem;
    background: color-mix(in oklab, var(--kef-success) 20%, transparent);
    color: var(--kef-success);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
  }

  .code-area {
    background: var(--kef-bg);
    padding: 32px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .editor-window {
    background: var(--kef-bg-card);
    border-radius: 16px;
    border: 1px solid var(--kef-line);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .code-content {
    flex: 1;
    overflow-y: auto;
  }

  .editor-header {
    background: var(--kef-bg-soft);
    padding: 12px 20px;
    border-bottom: 1px solid var(--kef-line);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .editor-controls {
    display: flex;
    gap: 8px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .dot.red { background: #ff5f56; }
  .dot.yellow { background: #ffbd2e; }
  .dot.green { background: #27c93f; }

  .editor-filename {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.85rem;
    color: var(--kef-text-soft);
    margin-left: 12px;
  }

  .code-content {
    padding: 24px;
    overflow-x: auto;
    flex: 1;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 14px;
    line-height: 1.6;
    color: var(--kef-text);
    background: var(--kef-bg);
  }

  .code-line {
    display: flex;
    min-height: 1.6em;
  }

  .code-line--empty {
    min-height: 0.8em;
  }

  .code-line.added {
    background: color-mix(in oklab, var(--kef-success) 12%, transparent);
    border-left: 3px solid var(--kef-success);
  }

  .code-line.removed {
    background: color-mix(in oklab, var(--kef-error) 12%, transparent);
    border-left: 3px solid var(--kef-error);
  }

  .line-number {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 40px;
    width: 40px;
    padding-right: 16px;
    color: var(--kef-text-soft);
    user-select: none;
  }

  .line-content {
    flex: 1;
    white-space: pre;
  }

  .not-found {
    color: var(--kef-text-soft);
    text-align: center;
    padding: 3rem 0;
  }

  @media (max-width: 900px) {
    .layout-container {
      grid-template-columns: 1fr;
    }
    .sidebar {
      border-right: none;
      border-bottom: 1px solid var(--kef-line);
      padding: 24px;
    }
    .code-area {
      padding: 0;
    }
    .editor-window {
      border-radius: 0;
      border-left: none;
      border-right: none;
    }
  }
</style>