<script lang="ts">
  import Icon from '@iconify/svelte';
  import { KEFINE_WALLET_PROVIDERS } from '$lib/components/kefine/kefine-auth-constants';
</script>

<div class="kefine-wallet-grid">
  {#each KEFINE_WALLET_PROVIDERS as provider}
    <span class={provider.className} aria-label={provider.label}>
      <span class="kefine-wallet-icon">
        <Icon icon={provider.icon} width="100%" height="100%" aria-hidden="true" />
      </span>
      <small>{provider.label}</small>
    </span>
  {/each}
</div>
