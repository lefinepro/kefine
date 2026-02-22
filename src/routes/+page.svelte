<script lang="ts">
  import { okrStore } from '$lib/stores/okrs';
  import { formatProgress } from '$lib/utils/formatters';
  import { getCurrentQuarter } from '$lib/utils/helpers';
  import { onMount } from 'svelte';

  let overallProgress = $state(0);

  onMount(() => {
    okrStore.loadFromLocalStorage();
    const { quarter, year } = getCurrentQuarter();
    overallProgress = okrStore.calculateOverallProgress(quarter, year);
  });
</script>

<main>
  <header>
    <h1>OKR Task Dashboard</h1>
    <p>Track your Objectives and Key Results</p>
  </header>

  <section class="overview">
    <div class="card">
      <h2>Overall Progress</h2>
      <p class="progress-value">{formatProgress(overallProgress)}</p>
    </div>
  </section>

  <section class="content">
    <p>Getting started: Create your first objective to track progress.</p>
  </section>
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: #111827;
  }

  header p {
    color: var(--color-muted);
    margin-top: 0.5rem;
  }

  .overview {
    margin-bottom: 2rem;
  }

  .card {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
  }

  .progress-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-primary);
    margin-top: var(--spacing-2);
  }

  .content {
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
  }
</style>
