<script lang="ts">
  import OKRIndex from '$lib/components/okrs/OKRIndex.svelte';
</script>

<main>
  <header class="page-header">
    <h1>OKR Task Dashboard</h1>
    <p>Track your Objectives and Key Results</p>
  </header>

  <OKRIndex />
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    margin-bottom: var(--spacing-8);
  }

  h1 {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: #111827;
  }

  .page-header p {
    color: var(--color-muted);
    margin-top: var(--spacing-2);
  }
</style>
