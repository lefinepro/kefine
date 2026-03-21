<script lang="ts">
  import KefineWorkspace from '$lib/components/kefine/KefineWorkspace.svelte';

  let {
    data
  }: {
    data: {
      initialOrderId: string;
    };
  } = $props();
</script>

<KefineWorkspace initialOrderId={data.initialOrderId} />
