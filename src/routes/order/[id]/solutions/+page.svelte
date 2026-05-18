<script lang="ts">
  import SolutionListPage from '$lib/components/kefine/SolutionListPage.svelte';

  let {
    data
  }: {
    data: {
      orderId: string;
      taskText: string;
    };
  } = $props();
</script>

<SolutionListPage orderId={data.orderId} taskText={data.taskText} />
