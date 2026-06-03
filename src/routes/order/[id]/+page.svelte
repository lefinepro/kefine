<script lang="ts">
  import KefineOrderSolversPage from '$lib/components/kefine/KefineOrderSolversPage.svelte';

  let { data }: { data: { orderId: string; taskText: string } } = $props();
</script>

<KefineOrderSolversPage orderId={data.orderId} taskText={data.taskText} />
