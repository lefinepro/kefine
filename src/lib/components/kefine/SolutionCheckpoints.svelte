<script lang="ts">
  export type CommitInfo = {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    refs: string;
    isHead: boolean;
  };

  const defaultCommits: CommitInfo[] = [
    { hash: 'fa964bbf0b745ad46206ed99eb33d56ce4b9be5e', shortHash: 'fa964bb', message: 'feat: add Checkpoints tab with commit history (VS Code SCM style)', author: 'Pavel Pasaz', refs: 'HEAD -> fix/tests-lighthouse-pnpm', isHead: true },
    { hash: '62655218d906ebffb336324b121755fb56e4ceac', shortHash: '6265521', message: 'fix: wrap rows in lef-row-group (inline-block, min-width:100%)', author: 'Pavel Pasaz', refs: 'origin/fix/tests-lighthouse-pnpm', isHead: false },
    { hash: 'cc6d0080695d71d2d1cc9a684e6218571717701c', shortHash: 'cc6d008', message: 'fix: add flex:1 to lef-line-text so background fills pane width', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: 'c15439361ea174e8ef7d670874a0c91ab2ec4913', shortHash: 'c154393', message: 'fix: flex layout with min-width auto, border-right on pane not side', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: 'b46cd8f11972f7b6efc34b0ced7d0a8843bb6dab', shortHash: 'b46cd8f', message: 'fix: inline-block instead of block so background fills pane width', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: '858ff7b5af9ea8ae163531b7eb4529468f4e4af0', shortHash: '858ff7b', message: 'fix: change lef-side from flex to inline-block for diff background', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: '2fc771c333b4bf4d6c320b7e4d5666cd6b0e3b89', shortHash: '2fc771c', message: 'fix: extend diff background to full code width, opaque line numbers', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: '7fc5262b5d1709c36cb61fd8c31453c2796de381', shortHash: '7fc5262', message: 'fix: apply Synt font to code only, revert file names to JetBrains', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: 'ad6d17a9215d737d6bdab0bc577b95194d1c6daa', shortHash: 'ad6d17a', message: 'feat: replace JetBrains Mono with Synt font for code', author: 'Pavel Pasaz', refs: '', isHead: false },
    { hash: 'f95b81ac2ad4b80b03e8e8d14589d9de388967a1', shortHash: 'f95b81a', message: 'fix: remove scrollbar from file tabs area', author: 'Pavel Pasaz', refs: '', isHead: false }
  ];

  let {
    commits,
    currentBranch,
    branches
  }: {
    commits: CommitInfo[];
    currentBranch: string;
    branches: string[];
  } = $props();

  const displayCommits = $derived(commits.length > 0 ? commits : defaultCommits);
  const displayBranch = $derived(currentBranch || 'fix/tests-lighthouse-pnpm');
</script>

<lef-cp-header>
  <lef-cp-branch-icon>
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  </lef-cp-branch-icon>
  <lef-cp-branch-name>{displayBranch}</lef-cp-branch-name>
</lef-cp-header>

<lef-cp-list>
  {#each displayCommits as commit, i (commit.hash)}
    <lef-cp-commit>
      <lef-cp-graph>
        {#if i < commits.length - 1}
          <lef-cp-line aria-hidden="true"></lef-cp-line>
        {/if}
        <lef-cp-dot class:lef-cp-dot--head={commit.isHead}></lef-cp-dot>
      </lef-cp-graph>
      <lef-cp-content>
        <lef-cp-message>{commit.message}</lef-cp-message>
        <lef-cp-meta>
          {#if commit.refs}
            {#each commit.refs.split(', ').filter((r: string) => r) as ref}
              {#if !ref.startsWith('HEAD')}
                <lef-cp-badge>{ref}</lef-cp-badge>
              {/if}
            {/each}
          {/if}
          <lef-cp-author>{commit.author}</lef-cp-author>
          <lef-cp-hash>{commit.shortHash}</lef-cp-hash>
        </lef-cp-meta>
      </lef-cp-content>
    </lef-cp-commit>
  {/each}
</lef-cp-list>

<style>
  lef-cp-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.85rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.6rem 0.6rem 0 0;
    border-bottom: none;
  }

  lef-cp-branch-icon {
    display: inline-flex;
    color: var(--lefine-text-soft);
  }

  lef-cp-branch-name {
    font-family: 'Synt', monospace;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--lefine-text);
  }

  lef-cp-list {
    display: flex;
    flex-direction: column;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0 0 0.6rem 0.6rem;
    overflow: hidden;
  }

  lef-cp-commit {
    display: flex;
    gap: 0.5rem;
    padding: 0.35rem 0.85rem;
    min-height: 2.2rem;
    align-items: flex-start;
    transition: background-color 120ms ease;
  }

  lef-cp-commit:hover {
    background: color-mix(in oklab, var(--lefine-text-soft) 6%, transparent);
  }

  lef-cp-graph {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 1.25rem;
    flex-shrink: 0;
    position: relative;
    padding-top: 0.5rem;
  }

  lef-cp-line {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: var(--kef-line);
    opacity: 0.4;
  }

  lef-cp-dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: color-mix(in oklab, var(--kef-color-primary, #7b61ff) 70%, var(--kef-bg-card));
    border: 2px solid var(--kef-bg-card);
    z-index: 1;
    flex-shrink: 0;
    margin-top: 0.15rem;
  }

  .lef-cp-dot--head {
    background: transparent;
    border: 2px solid var(--kef-color-primary, #7b61ff);
  }

  lef-cp-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    flex: 1;
    padding: 0.3rem 0;
  }

  lef-cp-message {
    font-size: 0.82rem;
    color: var(--lefine-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
  }

  lef-cp-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.72rem;
  }

  lef-cp-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    background: color-mix(in oklab, var(--kef-color-primary, #7b61ff) 16%, transparent);
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #7b61ff) 35%, transparent);
    color: color-mix(in oklab, var(--kef-color-primary, #7b61ff) 80%, white);
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    font-size: 0.68rem;
    white-space: nowrap;
  }

  lef-cp-author {
    color: var(--lefine-text-soft);
    white-space: nowrap;
  }

  lef-cp-hash {
    color: color-mix(in oklab, var(--lefine-text-soft) 60%, transparent);
    font-family: 'Synt', monospace;
    font-size: 0.68rem;
  }

  @media (max-width: 600px) {
    lef-cp-message {
      white-space: normal;
    }
  }
</style>
