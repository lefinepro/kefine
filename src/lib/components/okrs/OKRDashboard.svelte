<script lang="ts">
  import { okrStore } from '$lib/stores/okrs';
  import { untrack } from 'svelte';
  import type { Objective, KeyResult, Quarter } from '$lib/types/okr';
  import { getQuartersList, getYearsList, getCurrentQuarter } from '$lib/utils/helpers';
  import { formatProgress, formatQuarter, formatDate } from '$lib/utils/formatters';
  import { getProgressColor } from '$lib/utils/colors';
  import ProgressRing from './ProgressRing.svelte';
  import ObjectiveCard from './ObjectiveCard.svelte';
  import ObjectiveModal from './ObjectiveModal.svelte';
  import KeyResultModal from './KeyResultModal.svelte';

  type DashboardView = 'overview' | 'quarter' | 'year' | 'my-okrs';

  let activeView: DashboardView = $state('overview');
  let objectives: Objective[] = $state([]);
  let keyResults: KeyResult[] = $state([]);
  let isLoading = $state(true);

  // Modal state (passed down to ObjectiveCard actions)
  let showObjectiveModal = $state(false);
  let editingObjective: Objective | undefined = $state(undefined);
  let showKeyResultModal = $state(false);
  let keyResultObjectiveId: string | undefined = $state(undefined);
  let editingKeyResult: KeyResult | undefined = $state(undefined);

  const { quarter: currentQuarter, year: currentYear } = getCurrentQuarter();
  const quarters = getQuartersList();
  const years = getYearsList();

  // Quarter view filter
  let selectedQuarter: Quarter = $state(currentQuarter);
  let selectedYear: number = $state(currentYear);

  // Year view filter
  let selectedViewYear: number = $state(currentYear);

  $effect(() => {
    okrStore.loadFromLocalStorage();
    const unsubscribe = okrStore.subscribe((s) => {
      untrack(() => {
        objectives = s.objectives;
        keyResults = s.keyResults;
      });
    });
    isLoading = false;
    return unsubscribe;
  });

  /** Pure progress calculation for a key result */
  function calcKRProgress(kr: KeyResult): number {
    switch (kr.targetType) {
      case 'boolean':
        return kr.currentValue > 0 ? 100 : 0;
      case 'percentage':
      case 'number':
        return kr.targetValue > 0 ? Math.max(0, Math.min(100, (kr.currentValue / kr.targetValue) * 100)) : 0;
      default:
        return 0;
    }
  }

  /** Pure progress calculation for an objective */
  function calcObjectiveProgress(objectiveId: string): number {
    const objKRs = keyResults.filter((kr) => kr.objectiveId === objectiveId);
    if (objKRs.length === 0) return 0;
    const totalWeight = objKRs.reduce((s, kr) => s + kr.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = objKRs.reduce((s, kr) => s + (calcKRProgress(kr) * kr.weight) / totalWeight, 0);
    return Math.max(0, Math.min(100, weighted));
  }

  function getKeyResultsForObjective(objectiveId: string): KeyResult[] {
    return keyResults.filter((kr) => kr.objectiveId === objectiveId);
  }

  // ─── Overview Dashboard ───────────────────────────────────

  const activeObjectives = $derived(objectives.filter((obj) => obj.status === 'active'));
  const completedObjectives = $derived(objectives.filter((obj) => obj.status === 'completed'));

  const overallProgress = $derived(() => {
    if (objectives.length === 0) return 0;
    const total = objectives.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / objectives.length;
  });

  const completionRate = $derived(() => {
    if (objectives.length === 0) return 0;
    return (completedObjectives.length / objectives.length) * 100;
  });

  /** Recent changes: objectives sorted by updatedAt descending */
  const recentActivity = $derived(
    [...objectives]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
  );

  // ─── Quarter View ─────────────────────────────────────────

  const quarterObjectives = $derived(
    objectives.filter(
      (obj) => obj.quarter === selectedQuarter && obj.year === selectedYear
    )
  );

  const quarterProgress = $derived(() => {
    if (quarterObjectives.length === 0) return 0;
    const total = quarterObjectives.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / quarterObjectives.length;
  });

  /** Previous quarter for comparison */
  const prevQuarterLabel = $derived(() => {
    const qIndex = (['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[]).indexOf(selectedQuarter);
    if (qIndex === 0) return { quarter: 'Q4' as Quarter, year: selectedYear - 1 };
    return { quarter: (['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[])[qIndex - 1], year: selectedYear };
  });

  const prevQuarterObjectives = $derived(() => {
    const { quarter, year } = prevQuarterLabel();
    return objectives.filter((obj) => obj.quarter === quarter && obj.year === year);
  });

  const prevQuarterProgress = $derived(() => {
    const prevObjs = prevQuarterObjectives();
    if (prevObjs.length === 0) return 0;
    const total = prevObjs.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / prevObjs.length;
  });

  // ─── Year View ────────────────────────────────────────────

  const allQuarterNames = ['Q1', 'Q2', 'Q3', 'Q4'] as Quarter[];

  function getQuarterObjectives(quarter: Quarter, year: number): Objective[] {
    return objectives.filter((obj) => obj.quarter === quarter && obj.year === year);
  }

  function getQuarterProgress(quarter: Quarter, year: number): number {
    const objs = getQuarterObjectives(quarter, year);
    if (objs.length === 0) return 0;
    const total = objs.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / objs.length;
  }

  const yearObjectives = $derived(objectives.filter((obj) => obj.year === selectedViewYear));

  const yearProgress = $derived(() => {
    if (yearObjectives.length === 0) return 0;
    const total = yearObjectives.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / yearObjectives.length;
  });

  const prevYearProgress = $derived(() => {
    const prevObjs = objectives.filter((obj) => obj.year === selectedViewYear - 1);
    if (prevObjs.length === 0) return 0;
    const total = prevObjs.reduce((sum, obj) => sum + calcObjectiveProgress(obj.id), 0);
    return total / prevObjs.length;
  });

  // ─── Modal handlers ───────────────────────────────────────

  function openEditObjective(objective: Objective) {
    editingObjective = objective;
    showObjectiveModal = true;
  }

  function closeObjectiveModal() {
    showObjectiveModal = false;
    editingObjective = undefined;
  }

  function openAddKeyResult(objectiveId: string) {
    keyResultObjectiveId = objectiveId;
    editingKeyResult = undefined;
    showKeyResultModal = true;
  }

  function closeKeyResultModal() {
    showKeyResultModal = false;
    keyResultObjectiveId = undefined;
    editingKeyResult = undefined;
  }
</script>

<section class="okr-dashboard-views" aria-label="OKR Dashboard">
  <!-- View tabs -->
  <nav class="dashboard-tabs" aria-label="Dashboard views">
    <button
      type="button"
      class="dashboard-tab"
      aria-current={activeView === 'overview' ? 'page' : undefined}
      onclick={() => (activeView = 'overview')}
    >Overview</button>
    <button
      type="button"
      class="dashboard-tab"
      aria-current={activeView === 'quarter' ? 'page' : undefined}
      onclick={() => (activeView = 'quarter')}
    >Quarter</button>
    <button
      type="button"
      class="dashboard-tab"
      aria-current={activeView === 'year' ? 'page' : undefined}
      onclick={() => (activeView = 'year')}
    >Year</button>
    <button
      type="button"
      class="dashboard-tab"
      aria-current={activeView === 'my-okrs' ? 'page' : undefined}
      onclick={() => (activeView = 'my-okrs')}
    >My OKRs</button>
  </nav>

  <!-- ─── Overview View ─────────────────────────────── -->
  {#if activeView === 'overview'}
    <section class="dashboard-view" aria-label="Overview Dashboard">
      {#if isLoading}
        <dashboard-stats>
          {#each [1, 2, 3] as n (n)}
            <dashboard-stat aria-hidden="true">
              <skeleton-line data-size="title"></skeleton-line>
              <skeleton-line></skeleton-line>
            </dashboard-stat>
          {/each}
        </dashboard-stats>
      {:else if objectives.length === 0}
        <section class="okr-empty" aria-live="polite">
          <h2>No objectives yet</h2>
          <p>Add objectives from the OKR Index view to start tracking your goals.</p>
        </section>
      {:else}
        <!-- Stats row -->
        <dashboard-stats>
          <dashboard-stat>
            <ProgressRing progress={overallProgress()} size="lg" />
            <dashboard-stat-body>
              <dashboard-stat-label>Portfolio Progress</dashboard-stat-label>
              <dashboard-stat-value>{formatProgress(overallProgress())}</dashboard-stat-value>
            </dashboard-stat-body>
          </dashboard-stat>

          <dashboard-stat>
            <dashboard-stat-icon aria-hidden="true">🎯</dashboard-stat-icon>
            <dashboard-stat-body>
              <dashboard-stat-label>Active Objectives</dashboard-stat-label>
              <dashboard-stat-value>{activeObjectives.length}</dashboard-stat-value>
              <dashboard-stat-sub>{objectives.length} total</dashboard-stat-sub>
            </dashboard-stat-body>
          </dashboard-stat>

          <dashboard-stat>
            <dashboard-stat-icon aria-hidden="true">✅</dashboard-stat-icon>
            <dashboard-stat-body>
              <dashboard-stat-label>Completion Rate</dashboard-stat-label>
              <dashboard-stat-value>{formatProgress(completionRate())}</dashboard-stat-value>
              <dashboard-stat-sub>{completedObjectives.length} completed</dashboard-stat-sub>
            </dashboard-stat-body>
          </dashboard-stat>
        </dashboard-stats>

        <!-- Recent activity -->
        <section class="dashboard-section" aria-label="Recent activity">
          <h2 class="dashboard-section-title">Recent Activity</h2>
          {#if recentActivity.length === 0}
            <p class="dashboard-empty-msg">No recent activity.</p>
          {:else}
            <ul class="activity-list" aria-label="Recent objective updates">
              {#each recentActivity as obj (obj.id)}
                <li class="activity-item">
                  <activity-dot
                    style="background: {getProgressColor(calcObjectiveProgress(obj.id))}"
                    aria-hidden="true"
                  ></activity-dot>
                  <activity-body>
                    <activity-title>{obj.title}</activity-title>
                    <activity-meta>
                      {formatQuarter(obj.quarter, obj.year)} · {obj.status}
                      · updated {formatDate(obj.updatedAt)}
                    </activity-meta>
                  </activity-body>
                  <activity-progress>{formatProgress(calcObjectiveProgress(obj.id))}</activity-progress>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}
    </section>

  <!-- ─── Quarter View ──────────────────────────────── -->
  {:else if activeView === 'quarter'}
    <section class="dashboard-view" aria-label="Quarter View">
      <!-- Quarter selector -->
      <fieldset class="dashboard-filters" aria-label="Select quarter">
        <select bind:value={selectedQuarter} aria-label="Select quarter">
          {#each quarters as q (q.value)}
            <option value={q.value}>{q.label}</option>
          {/each}
        </select>
        <select bind:value={selectedYear} aria-label="Select year">
          {#each years as y (y)}
            <option value={y}>{y}</option>
          {/each}
        </select>
      </fieldset>

      <!-- Quarter summary -->
      <dashboard-stats>
        <dashboard-stat>
          <ProgressRing progress={quarterProgress()} size="lg" />
          <dashboard-stat-body>
            <dashboard-stat-label>{selectedQuarter} {selectedYear} Progress</dashboard-stat-label>
            <dashboard-stat-value>{formatProgress(quarterProgress())}</dashboard-stat-value>
          </dashboard-stat-body>
        </dashboard-stat>

        <dashboard-stat>
          <dashboard-stat-icon aria-hidden="true">📋</dashboard-stat-icon>
          <dashboard-stat-body>
            <dashboard-stat-label>Objectives</dashboard-stat-label>
            <dashboard-stat-value>{quarterObjectives.length}</dashboard-stat-value>
          </dashboard-stat-body>
        </dashboard-stat>

        <!-- Comparison with previous quarter -->
        <dashboard-stat>
          <dashboard-stat-icon aria-hidden="true">📊</dashboard-stat-icon>
          <dashboard-stat-body>
            <dashboard-stat-label>vs {prevQuarterLabel().quarter} {prevQuarterLabel().year}</dashboard-stat-label>
            <dashboard-stat-value>
              {#if prevQuarterObjectives().length === 0}
                —
              {:else}
                {@const diff = quarterProgress() - prevQuarterProgress()}
                <span
                  class="trend"
                  data-trend={diff >= 0 ? 'up' : 'down'}
                  aria-label="{diff >= 0 ? 'Up' : 'Down'} {Math.abs(diff).toFixed(0)}% vs previous quarter"
                >
                  {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(0)}%
                </span>
              {/if}
            </dashboard-stat-value>
            <dashboard-stat-sub>
              {prevQuarterObjectives().length} objectives prev. quarter
            </dashboard-stat-sub>
          </dashboard-stat-body>
        </dashboard-stat>
      </dashboard-stats>

      <!-- Quarter objectives grid -->
      {#if quarterObjectives.length === 0}
        <section class="okr-empty" aria-live="polite">
          <h2>No objectives for {selectedQuarter} {selectedYear}</h2>
          <p>Add objectives in the OKR Index view for this quarter.</p>
        </section>
      {:else}
        <ul class="okr-grid">
          {#each quarterObjectives as objective (objective.id)}
            <li>
              <ObjectiveCard
                {objective}
                keyResults={getKeyResultsForObjective(objective.id)}
                onEdit={openEditObjective}
                onAddKeyResult={openAddKeyResult}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </section>

  <!-- ─── Year View ─────────────────────────────────── -->
  {:else if activeView === 'year'}
    <section class="dashboard-view" aria-label="Year View">
      <!-- Year selector -->
      <fieldset class="dashboard-filters" aria-label="Select year">
        <select bind:value={selectedViewYear} aria-label="Select year">
          {#each years as y (y)}
            <option value={y}>{y}</option>
          {/each}
        </select>
      </fieldset>

      <!-- Year summary -->
      <dashboard-stats>
        <dashboard-stat>
          <ProgressRing progress={yearProgress()} size="lg" />
          <dashboard-stat-body>
            <dashboard-stat-label>{selectedViewYear} Annual Progress</dashboard-stat-label>
            <dashboard-stat-value>{formatProgress(yearProgress())}</dashboard-stat-value>
            <dashboard-stat-sub>{yearObjectives.length} objectives</dashboard-stat-sub>
          </dashboard-stat-body>
        </dashboard-stat>

        <dashboard-stat>
          <dashboard-stat-icon aria-hidden="true">📈</dashboard-stat-icon>
          <dashboard-stat-body>
            <dashboard-stat-label>vs {selectedViewYear - 1}</dashboard-stat-label>
            <dashboard-stat-value>
              {#if objectives.filter((o) => o.year === selectedViewYear - 1).length === 0}
                —
              {:else}
                {@const diff = yearProgress() - prevYearProgress()}
                <span
                  class="trend"
                  data-trend={diff >= 0 ? 'up' : 'down'}
                  aria-label="{diff >= 0 ? 'Up' : 'Down'} {Math.abs(diff).toFixed(0)}% vs previous year"
                >
                  {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(0)}%
                </span>
              {/if}
            </dashboard-stat-value>
            <dashboard-stat-sub>year-over-year</dashboard-stat-sub>
          </dashboard-stat-body>
        </dashboard-stat>
      </dashboard-stats>

      <!-- All 4 quarters -->
      <section class="year-quarters" aria-label="Quarters for {selectedViewYear}">
        {#each allQuarterNames as q (q)}
          {@const qObjs = getQuarterObjectives(q, selectedViewYear)}
          {@const qProgress = getQuarterProgress(q, selectedViewYear)}
          <section class="year-quarter-section" aria-label="{q} {selectedViewYear}">
            <header class="year-quarter-header">
              <h3>{q} {selectedViewYear}</h3>
              <year-quarter-meta>
                <ProgressRing progress={qProgress} size="sm" />
                <year-quarter-count>{qObjs.length} objective{qObjs.length !== 1 ? 's' : ''}</year-quarter-count>
              </year-quarter-meta>
            </header>

            {#if qObjs.length === 0}
              <p class="dashboard-empty-msg">No objectives.</p>
            {:else}
              <ul class="quarter-objective-list" aria-label="Objectives for {q} {selectedViewYear}">
                {#each qObjs as obj (obj.id)}
                  <li class="quarter-objective-item">
                    <quarter-obj-bar>
                      <quarter-obj-fill
                        style="width: {calcObjectiveProgress(obj.id)}%; background: {getProgressColor(calcObjectiveProgress(obj.id))}"
                      ></quarter-obj-fill>
                    </quarter-obj-bar>
                    <quarter-obj-title>{obj.title}</quarter-obj-title>
                    <quarter-obj-pct>{formatProgress(calcObjectiveProgress(obj.id))}</quarter-obj-pct>
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/each}
      </section>
    </section>

  <!-- ─── My OKRs View ──────────────────────────────── -->
  {:else if activeView === 'my-okrs'}
    <section class="dashboard-view" aria-label="My OKRs">
      {#if objectives.length === 0}
        <section class="okr-empty" aria-live="polite">
          <h2>No objectives yet</h2>
          <p>Add objectives in the OKR Index view to start tracking your goals.</p>
        </section>
      {:else}
        <!-- Personal summary -->
        <dashboard-stats>
          <dashboard-stat>
            <ProgressRing progress={overallProgress()} size="lg" />
            <dashboard-stat-body>
              <dashboard-stat-label>My Overall Progress</dashboard-stat-label>
              <dashboard-stat-value>{formatProgress(overallProgress())}</dashboard-stat-value>
            </dashboard-stat-body>
          </dashboard-stat>

          <dashboard-stat>
            <dashboard-stat-icon aria-hidden="true">🎯</dashboard-stat-icon>
            <dashboard-stat-body>
              <dashboard-stat-label>Active OKRs</dashboard-stat-label>
              <dashboard-stat-value>{activeObjectives.length}</dashboard-stat-value>
            </dashboard-stat-body>
          </dashboard-stat>

          <dashboard-stat>
            <dashboard-stat-icon aria-hidden="true">✅</dashboard-stat-icon>
            <dashboard-stat-body>
              <dashboard-stat-label>Completed</dashboard-stat-label>
              <dashboard-stat-value>{completedObjectives.length}</dashboard-stat-value>
            </dashboard-stat-body>
          </dashboard-stat>
        </dashboard-stats>

        <!-- Active objectives with task completion view -->
        <section class="dashboard-section" aria-label="Active objectives">
          <h2 class="dashboard-section-title">Active Objectives</h2>
          {#if activeObjectives.length === 0}
            <p class="dashboard-empty-msg">No active objectives. Mark objectives as active in the OKR Index.</p>
          {:else}
            <ul class="okr-grid">
              {#each activeObjectives as objective (objective.id)}
                <li>
                  <ObjectiveCard
                    {objective}
                    keyResults={getKeyResultsForObjective(objective.id)}
                    onEdit={openEditObjective}
                    onAddKeyResult={openAddKeyResult}
                  />
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/if}
    </section>
  {/if}
</section>

<!-- Objective Modal -->
{#if showObjectiveModal}
  <ObjectiveModal
    objective={editingObjective}
    onClose={closeObjectiveModal}
  />
{/if}

<!-- Key Result Modal -->
{#if showKeyResultModal}
  <KeyResultModal
    keyResult={editingKeyResult}
    objectiveId={keyResultObjectiveId}
    {objectives}
    onClose={closeKeyResultModal}
  />
{/if}
