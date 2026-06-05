<script lang="ts">
  import KefineOrderSolversPage from '$lib/components/kefine/KefineOrderSolversPage.svelte';

  let { data }: { data: { initialOrderId: string; taskText?: string } } = $props();
</script>

<KefineOrderSolversPage orderId={data.initialOrderId} taskText={data.taskText ?? ''} />
