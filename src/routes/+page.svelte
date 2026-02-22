<script lang="ts">
  import OKRIndex from '$lib/components/okrs/OKRIndex.svelte';
  import TaskList from '$lib/components/tasks/TaskList.svelte';
</script>

<main class="okr-dashboard">
  <header class="okr-header">
    <h1>OKR Task Dashboard</h1>
    <p>Track your Objectives and Key Results</p>
  </header>

  <OKRIndex />

  <section class="task-section">
    <h2 class="task-section-title">Tasks</h2>
    <TaskList />
  </section>
</main>
