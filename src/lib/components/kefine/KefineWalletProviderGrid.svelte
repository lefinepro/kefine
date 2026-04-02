<script lang="ts">
  import Icon from '@iconify/svelte';
  import { KEFINE_WALLET_PROVIDERS } from '$lib/components/kefine/kefine-auth-constants';
</script>

<lefine-box class="kefine-wallet-grid">
  {#each KEFINE_WALLET_PROVIDERS as provider}
    <lefine-text class={provider.className} aria-label={provider.label}>
      <lefine-text class="kefine-wallet-icon">
        <Icon icon={provider.icon} width="100%" height="100%" aria-hidden="true" />
      </lefine-text>
      <small>{provider.label}</small>
    </lefine-text>
  {/each}
</lefine-box>
