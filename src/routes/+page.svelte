<script lang="ts">
  import OKRIndex from '$lib/components/okrs/OKRIndex.svelte';
  import AuthButton from '$lib/components/auth/AuthButton.svelte';
</script>

<main class="okr-dashboard">
  <header class="okr-header">
    <hgroup>
      <h1>OKR Task Dashboard</h1>
      <p>Track your Objectives and Key Results</p>
    </hgroup>
    <AuthButton />
  </header>

  <OKRIndex />
</main>
