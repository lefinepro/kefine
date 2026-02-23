<script lang="ts">
  import OKRIndex from '$lib/components/okrs/OKRIndex.svelte';
  import OKRDashboard from '$lib/components/okrs/OKRDashboard.svelte';
  import AuthButton from '$lib/components/auth/AuthButton.svelte';

  let showDashboard = $state(false);
</script>

<main class="okr-dashboard">
  <header class="okr-header">
    <hgroup>
      <h1>OKR Task Dashboard</h1>
      <p>Track your Objectives and Key Results</p>
    </hgroup>
    <nav class="okr-page-nav" aria-label="Page navigation">
      <button
        type="button"
        data-variant={showDashboard ? 'ghost' : 'primary'}
        onclick={() => (showDashboard = false)}
        aria-current={!showDashboard ? 'page' : undefined}
      >OKR Index</button>
      <button
        type="button"
        data-variant={showDashboard ? 'primary' : 'ghost'}
        onclick={() => (showDashboard = true)}
        aria-current={showDashboard ? 'page' : undefined}
      >Dashboard</button>
    </nav>
    <AuthButton />
  </header>

  {#if showDashboard}
    <OKRDashboard />
  {:else}
    <OKRIndex />
  {/if}
</main>
