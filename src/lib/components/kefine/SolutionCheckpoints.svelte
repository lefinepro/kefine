<script lang="ts">
  import { defaultSolutions } from '$lib/kefine/solutions-data';

  export type CommitInfo = {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    refs: string;
    isHead: boolean;
  };

  function buildCommitsFor(slug: string, title: string): CommitInfo[] {
    const head: CommitInfo =
      { hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b012c', shortHash: 'c3d4e5f', message: `feat: add ${title.toLowerCase()}`, author: 'Pavel Pasaz', refs: `HEAD -> ${slug}`, isHead: true };

    const older: CommitInfo[] = [
      { hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b012cde4', shortHash: 'e5f6a7b', message: 'feat: print "Proxying: %s %s\\n", r.Method, r.URL', author: 'Pavel Pasaz', refs: '', isHead: false },
      { hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b012cd', shortHash: 'd4e5f6a', message: 'feat: add HTTP proxy handler with forwarding', author: 'Pavel Pasaz', refs: '', isHead: false },
      { hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b01', shortHash: 'b2c3d4e', message: 'chore: add project config and deps', author: 'Pavel Pasaz', refs: '', isHead: false },
      { hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0', shortHash: 'a1b2c3d', message: 'chore: create project', author: 'Pavel Pasaz', refs: '', isHead: false },
    ];

    if (title.includes('Rate Limiting')) {
      older.unshift(
        { hash: 'b8c9d0e1f2a3b4c5d6e7f8a9b012cde5f6a7b', shortHash: 'b8c9d0e', message: 'feat: add Prometheus metrics endpoint', author: 'Pavel Pasaz', refs: '', isHead: false },
        { hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b012cde5f6a', shortHash: 'a7b8c9d', message: 'feat: add response caching layer', author: 'Pavel Pasaz', refs: '', isHead: false },
        { hash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b012cde5f', shortHash: 'f6a7b8c', message: 'feat: add rate limiter middleware', author: 'Pavel Pasaz', refs: '', isHead: false },
      );
    } else if (title.includes('Production-ready')) {
      older.unshift(
        { hash: 'd0e1f2a3b4c5d6e7f8a9b012cde5f6a7b8c9d', shortHash: 'd0e1f2a', message: 'feat: add config file support', author: 'Pavel Pasaz', refs: '', isHead: false },
        { hash: 'c9d0e1f2a3b4c5d6e7f8a9b012cde5f6a7b8c', shortHash: 'c9d0e1f', message: 'feat: add request/response structured logging', author: 'Pavel Pasaz', refs: '', isHead: false },
      );
    }
    if (title.toLowerCase().includes('hello world')) {
      older.unshift(
        { hash: 'e1f2a3b4c5d6e7f8a9b012cde5f6a7b8c9d0e', shortHash: 'e1f2a3b', message: 'feat: implement hello world logic', author: 'Pavel Pasaz', refs: '', isHead: false },
      );
    }

    return [head, ...older];
  }

  let {
    commits,
    currentBranch,
    branches,
    solutionTitle,
    solutionProject,
    solutionSlug,
    solverName
  }: {
    commits: CommitInfo[];
    currentBranch: string;
    branches: string[];
    solutionTitle?: string;
    solutionProject?: string;
    solutionSlug?: string;
    solverName?: string;
  } = $props();

  const slug = $derived(solutionSlug || currentBranch || 'main');
  const project = $derived(solutionProject || '');
  const hintCommits = $derived(commits.length > 0 ? commits : buildCommitsFor(slug, solutionTitle || 'project'));
  const hintBranch = $derived(currentBranch || slug);
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
  <lef-cp-branch-name>{hintBranch}</lef-cp-branch-name>
  {#if project}
    <lef-cp-project-name>{project}</lef-cp-project-name>
  {/if}
</lef-cp-header>

<lef-cp-list>
  {#each hintCommits as commit, i (commit.hash)}
    <lef-cp-commit>
      <lef-cp-graph>
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

  lef-cp-project-name {
    font-family: 'Synt', monospace;
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    margin-left: auto;
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

  lef-cp-graph::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(50% - 0.5px);
    width: 1px;
    background: color-mix(in oklab, var(--lefine-text-soft) 30%, transparent);
  }

  lef-cp-commit:last-child lef-cp-graph::before {
    display: none;
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
