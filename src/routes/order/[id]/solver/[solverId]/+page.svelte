<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import '$lib/kefine/jetbrains-hljs.css';
  import { solutionsStore } from '$lib/kefine/solutions-store';
  import { defaultMetrics, defaultSolutions } from '$lib/kefine/solutions-data';
  import { solverAvatarColor, solverInitials } from '$lib/kefine/solver-avatars';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import SolutionCodeEditor from '$lib/components/kefine/SolutionCodeEditor.svelte';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import SolutionTopbar from '$lib/components/kefine/SolutionTopbar.svelte';
  import SolutionTaskPanel from '$lib/components/kefine/SolutionTaskPanel.svelte';
  import SolutionViewTabs from '$lib/components/kefine/SolutionViewTabs.svelte';
  import SolutionTestingPanel from '$lib/components/kefine/SolutionTestingPanel.svelte';
  import SolutionFileOutline from '$lib/components/kefine/SolutionFileOutline.svelte';
  import SolutionCheckpoints from '$lib/components/kefine/SolutionCheckpoints.svelte';
  import KefineSolverFlyingMenu from '$lib/components/kefine/KefineSolverFlyingMenu.svelte';
  import type { CommitInfo } from './+page.server';

  type SolutionView = 'overview' | 'source' | 'checkpoints';

  let {
    data
  }: {
    data: {
      orderId: string;
      solverId: string;
      commits?: CommitInfo[];
      currentBranch?: string;
      branches?: string[];
    };
  } = $props();

  type CommentEntry = {
    id: string;
    text: string;
    timestamp: number;
    pending?: boolean;
  };

  let stored = $state(solutionsStore.getAll());
  let comments = $state<CommentEntry[]>([]);
  let showCorrected = $state(false);
  let isCorrectingTask = $state(false);
  let isMerged = $state(false);
  let correctionTimer: ReturnType<typeof setTimeout> | null = null;
  const localeText = $derived($kefineLocaleText);
  const labels = $derived(localeText.solutionView);

  onMount(() => {
    if (stored.length === 0) {
      solutionsStore.set([...defaultSolutions]);
    }
    return solutionsStore.subscribe(value => {
      stored = value;
    });
  });

  onDestroy(() => {
    if (correctionTimer) {
      clearTimeout(correctionTimer);
      correctionTimer = null;
    }
  });

  const solution = $derived(
    defaultSolutions.find(s => s.id === data.solverId)
      ?? stored.find(s => s.id === data.solverId)
      ?? null
  );
  const allSolutions = $derived.by(() => {
    const merged = [...defaultSolutions, ...stored];
    const seen = new Set<string>();

    return merged.filter((entry) => {
      if (seen.has(entry.id)) {
        return false;
      }

      seen.add(entry.id);
      return true;
    });
  });
  const sidebarSolutions = $derived.by(() => {
    if (!solution) {
      return [];
    }

    const project = solution.project?.trim();
    const sameProject = project
      ? allSolutions.filter((entry) => entry.project === project)
      : [];

    return sameProject.length > 0
      ? sameProject
      : allSolutions.filter((entry) => entry.id === solution.id);
  });
  const overviewMetrics = $derived(
    defaultMetrics.filter((metric) =>
      sidebarSolutions.some((entry) => entry.id === metric.solverId)
    )
  );

  const taskTitle = $derived(solution?.title ?? labels.fallbackTitle);
  const taskDescription = $derived(solution?.description ?? '');

  const hasCorrection = $derived(Boolean(solution?.correctedCodeLines));

  $effect(() => {
    void solution?.id;
    showCorrected = Boolean(solution?.correctedCodeLines);
    isCorrectingTask = false;
    isMerged = false;
    if (correctionTimer) {
      clearTimeout(correctionTimer);
      correctionTimer = null;
    }
    comments = [];
  });

  const files = $derived(
    showCorrected && solution?.correctedDiffs ? solution.correctedDiffs : (solution?.diffs ?? [])
  );
  let activeFile = $state('');
  let activeView = $state<SolutionView>('overview');

  $effect(() => {
    if (files.length > 0 && !files.some((f: { file: string }) => f.file === activeFile)) {
      activeFile = files[0].file;
    }
  });

  const activeLines = $derived.by(() => {
    if (!solution) return [];
    if (showCorrected) {
      return (
        solution.correctedFileCodeLines?.[activeFile]
          ?? solution.correctedCodeLines
          ?? solution.fileCodeLines?.[activeFile]
          ?? solution.codeLines
          ?? []
      );
    }
    return solution.fileCodeLines?.[activeFile] ?? solution.codeLines ?? [];
  });

  function selectFile(file: string) {
    activeFile = file;
  }

  function chooseSolver(id: string) {
    if (id === data.solverId) {
      return;
    }

    goto(`/order/${data.orderId}/solver/${id}`);
  }

  function goBack(event: MouseEvent) {
    event.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto(`/order/${data.orderId}`);
    }
  }

  function handleSubmitCorrection(text: string) {
    if (isCorrectingTask) return;

    const id = `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    comments = [
      ...comments,
      { id, text, timestamp: Date.now(), pending: true }
    ];

    isCorrectingTask = true;
    showCorrected = false;

    if (correctionTimer) {
      clearTimeout(correctionTimer);
    }

    correctionTimer = setTimeout(() => {
      isCorrectingTask = false;
      showCorrected = Boolean(solution?.correctedCodeLines);
      comments = comments.map(c => (c.id === id ? { ...c, pending: false } : c));
      correctionTimer = null;
    }, 5000);
  }

  function handleMerge() {
    if (isCorrectingTask || isMerged) return;
    isMerged = true;
  }
</script>

<svelte:head>
  <title>{solution ? `${solution.solver} | Lefine` : `${labels.fallbackTitle} | Lefine`}</title>
</svelte:head>

<lef-solver-page>
  {#if solution}
    <SolutionTopbar
      title={solution.title}
      author={solution.solver}
      project={solution.project}
      slug={solution.slug}
      backHref={`/order/${data.orderId}`}
      onBack={goBack}
      onMerge={handleMerge}
      isMerged={isMerged}
      isMerging={isCorrectingTask}
    />

    <lef-solver-grid>
      <lef-solver-mode-row>
        <SolutionViewTabs active={activeView} onSelect={(v) => (activeView = v)} />
        {#if hasCorrection}
          <lef-correction-status data-active={isCorrectingTask} data-show-corrected={showCorrected}>
            {#if isCorrectingTask}
              <lef-correction-arrow aria-label={labels.correctionApplying}>
                <lef-arrow-track>
                  <lef-arrow-tip>➵</lef-arrow-tip>
                </lef-arrow-track>
                <lefine-text>{labels.correctionApplying}</lefine-text>
              </lef-correction-arrow>
            {:else if showCorrected}
              <lef-correction-applied>
                <lefine-text>{labels.correctionApplied}</lefine-text>
              </lef-correction-applied>
            {:else}
              <lef-correction-pending>
                <lefine-text>{labels.correctionPending}</lefine-text>
              </lef-correction-pending>
            {/if}
          </lef-correction-status>
        {/if}
      </lef-solver-mode-row>

      {#if activeView === 'source'}
        <lef-solver-source>
          <lef-solver-outline-col>
            <SolutionFileOutline
              files={files}
              activeFile={activeFile}
              onSelect={selectFile}
            />
          </lef-solver-outline-col>

          <lef-solver-main>
            <SolutionCodeEditor
              activeFile={activeFile}
              files={files}
              lines={activeLines}
              onSelect={selectFile}
            />

            <SolutionTaskPanel
              title={taskTitle}
              description={taskDescription}
              {comments}
              {isCorrectingTask}
              onSubmitCorrection={handleSubmitCorrection}
            />
          </lef-solver-main>
        </lef-solver-source>
      {:else if activeView === 'checkpoints'}
        <lef-solver-checkpoints>
          <SolutionCheckpoints
            commits={data.commits ?? []}
            currentBranch={data.currentBranch ?? ''}
            branches={data.branches ?? []}
            solutionTitle={solution?.title}
            solutionProject={solution?.project}
            solutionSlug={solution?.slug}
            solverName={solution?.solver}
          />
        </lef-solver-checkpoints>
      {:else}
        <lef-solver-overview data-testid="solution-overview">
          <aside data-testid="solution-solver-sidebar" aria-label="Solvers">
            {#each sidebarSolutions as candidate (candidate.id)}
              <button
                type="button"
                data-active={candidate.id === data.solverId ? 'true' : 'false'}
                aria-current={candidate.id === data.solverId ? 'page' : undefined}
                onclick={() => chooseSolver(candidate.id)}
              >
                <lef-solver-avatar
                  style="--avatar-color: {solverAvatarColor(candidate.solver)}"
                  aria-hidden="true"
                >{solverInitials(candidate.solver)}</lef-solver-avatar>
                <lef-solver-option-copy>
                  <strong>{candidate.solver}</strong>
                  <small>{candidate.title}</small>
                </lef-solver-option-copy>
              </button>
            {/each}
          </aside>

          <lef-solver-testing>
            <SolutionTestingPanel
              endpoint={'/'}
              sampleBody={'{\n  "ping": "hello"\n}'}
              sampleResponse={'{\n  "ok": true,\n  "message": "proxy ready"\n}'}
            />

            <SolutionTaskPanel
              title={taskTitle}
              description={taskDescription}
              {comments}
              {isCorrectingTask}
              onSubmitCorrection={handleSubmitCorrection}
            />
          </lef-solver-testing>

          {#if overviewMetrics.length > 0}
            <lef-solver-metrics-col>
              <SolutionMetricsMini
                metrics={overviewMetrics}
                activeSolverId={data.solverId}
                project={solution.project}
                slug={solution.slug}
              />
            </lef-solver-metrics-col>
          {/if}
        </lef-solver-overview>
      {/if}
    </lef-solver-grid>

    <KefineSolverFlyingMenu
      solvers={sidebarSolutions}
      activeId={data.solverId}
      onSelect={chooseSolver}
    />
  {:else}
    <lef-empty-state>{labels.emptyState}</lef-empty-state>
  {/if}
</lef-solver-page>

<style>
  lef-solver-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--kef-bg);
    color: var(--lefine-text);
  }

  lef-solver-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 1.5rem 1.5rem;
    width: 100%;
    max-width: 80rem;
    margin: 0 auto;
    flex: 1;
    min-height: 0;
  }

  lef-solver-mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
    line-height: 1.4;
  }

  lef-solver-source {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 0.85rem;
    min-height: 0;
  }

  lef-solver-outline-col {
    display: block;
    min-width: 0;
  }

  lef-solver-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  lef-solver-testing {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    min-width: 0;
    min-height: 420px;
  }

  lef-solver-overview {
    display: grid;
    grid-template-columns: 210px minmax(0, 1fr) 260px;
    align-items: start;
    gap: 0.85rem;
    min-width: 0;
  }

  aside[data-testid='solution-solver-sidebar'] {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  aside[data-testid='solution-solver-sidebar'] button {
    display: grid;
    grid-template-columns: 1.75rem minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    min-height: 3.05rem;
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.5rem;
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    text-align: left;
  }

  aside[data-testid='solution-solver-sidebar'] button:hover,
  aside[data-testid='solution-solver-sidebar'] button[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 42%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  lef-solver-avatar {
    display: inline-grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 8px;
    background: var(--avatar-color, var(--kef-color-primary, #3a7afe));
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
  }

  lef-solver-option-copy {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  lef-solver-option-copy strong,
  lef-solver-option-copy small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solver-option-copy strong {
    font-size: 0.82rem;
    line-height: 1.25;
  }

  lef-solver-option-copy small {
    color: var(--lefine-text-soft);
    font-size: 0.74rem;
    line-height: 1.25;
  }

  lef-solver-metrics-col {
    display: block;
    min-width: 0;
  }

  lef-solver-checkpoints {
    display: block;
    min-width: 0;
  }

  lef-correction-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.5rem;
    font-size: 0.82rem;
    line-height: 1.4;
    min-height: 2.1rem;
  }

  lef-correction-status[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 50%, var(--kef-line-soft));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  lef-correction-status[data-show-corrected='true']:not([data-active='true']) {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 45%, var(--kef-line-soft));
  }

  lef-correction-arrow {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--kef-color-primary, #3a7afe);
    font-weight: 600;
  }

  lef-arrow-track {
    display: inline-block;
    width: 1.6rem;
    height: 1rem;
    position: relative;
    overflow: hidden;
  }

  lef-arrow-tip {
    display: inline-block;
    position: absolute;
    left: 0;
    top: 0;
    font-size: 1rem;
    line-height: 1rem;
    color: currentColor;
    animation: lef-arrow-fly 1.1s linear infinite;
  }

  @keyframes lef-arrow-fly {
    0%   { transform: translateX(-90%); opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateX(110%); opacity: 0; }
  }

  lef-correction-applied {
    color: var(--kef-success, #16a34a);
    font-weight: 600;
  }

  lef-correction-pending {
    color: var(--lefine-text-soft);
  }

  lef-empty-state {
    display: block;
    padding: 4rem 0;
    text-align: center;
    color: var(--lefine-text-soft);
  }

  @media (prefers-reduced-motion: reduce) {
    lef-arrow-tip { animation: none; }
  }

  @media (max-width: 900px) {
    lef-solver-grid {
      padding: 1rem;
    }
    lef-solver-source,
    lef-solver-overview {
      grid-template-columns: 1fr;
    }
  }
</style>
