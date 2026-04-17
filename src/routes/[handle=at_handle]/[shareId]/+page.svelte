<script lang="ts">
  import KefineWorkspace from '$lib/components/kefine/KefineWorkspace.svelte';

  let {
    data
  }: {
    data: {
      initialActorHandle: string;
      initialOrderId: string;
    };
  } = $props();
</script>

<KefineWorkspace initialActorHandle={data.initialActorHandle} initialOrderId={data.initialOrderId} />
