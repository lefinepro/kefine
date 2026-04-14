<script lang="ts">
  export type KefineTopbarIconName =
    | 'mastodon'
    | 'discord'
    | 'linkedin'
    | 'telegram'
    | 'theme-auto'
    | 'theme-light'
    | 'theme-dark'
    | 'email'
    | 'copy'
    | 'check'
    | 'open'
    | 'github'
    | 'flag-en'
    | 'flag-ru'
    | 'flag-hy';

  let {
    name,
    size = 20
  }: {
    name: KefineTopbarIconName;
    size?: number;
  } = $props();

  const clipId = $derived(`kefine-topbar-clip-${name}`);
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if name === 'mastodon'}
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <path d="M8 16V9.6c0-1.3 1.1-2.3 2.3-2.3 1 0 1.8.5 2.3 1.3.5-.8 1.3-1.3 2.3-1.3 1.2 0 2.1 1 2.1 2.3V16" />
  {:else if name === 'discord'}
    <path d="M7.5 7.8c2.2-1.4 6.8-1.4 9 0l1.2 7.1c-1.5 1.4-3 2.3-4.4 2.8l-.8-1.7c.5-.2 1-.4 1.4-.7-1.6.7-4.2.7-5.8 0 .4.3.9.5 1.4.7l-.8 1.7c-1.4-.5-2.9-1.4-4.4-2.8z" />
    <circle cx="9.8" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="14.2" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
  {:else if name === 'linkedin'}
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="8.2" cy="9" r="1" fill="currentColor" stroke="none" />
    <path d="M7.3 11.2V16" />
    <path d="M11.2 16v-4.1c0-1.1.8-1.9 1.9-1.9s1.9.8 1.9 1.9V16" />
    <path d="M11.2 11.2V16" />
  {:else if name === 'telegram'}
    <path d="M20 5 4.8 10.9c-.7.3-.7 1.3.1 1.5l3.6 1.2 1.4 4.2c.2.7 1.1.8 1.5.2L14 14l3.9 2.9c.6.4 1.5.1 1.6-.7L21 6.4c.1-.9-.6-1.7-1.5-1.4Z" />
  {:else if name === 'theme-auto'}
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 3.5V6" />
    <path d="M12 18v2.5" />
    <path d="M3.5 12H6" />
    <path d="M18 12h2.5" />
    <path d="m6.1 6.1 1.7 1.7" />
    <path d="m16.2 16.2 1.7 1.7" />
    <path d="m17.9 6.1-1.7 1.7" />
    <path d="m7.8 16.2-1.7 1.7" />
    <path d="M12 7.8a4.2 4.2 0 0 0 0 8.4Z" fill="currentColor" stroke="none" opacity="0.28" />
  {:else if name === 'theme-light'}
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.8v2.6" />
    <path d="M12 18.6v2.6" />
    <path d="M2.8 12h2.6" />
    <path d="M18.6 12h2.6" />
    <path d="m5.6 5.6 1.8 1.8" />
    <path d="m16.6 16.6 1.8 1.8" />
    <path d="m18.4 5.6-1.8 1.8" />
    <path d="m7.4 16.6-1.8 1.8" />
  {:else if name === 'theme-dark'}
    <path d="M15.9 3.7a7.4 7.4 0 1 0 4.4 11.8A8.5 8.5 0 0 1 15.9 3.7Z" />
  {:else if name === 'email'}
    <rect x="4" y="6" width="16" height="12" rx="2.4" />
    <path d="m5.6 7.8 6.4 5 6.4-5" />
  {:else if name === 'copy'}
    <rect x="9" y="7" width="10" height="12" rx="2.2" />
    <path d="M15 7V6.2A2.2 2.2 0 0 0 12.8 4H7.2A2.2 2.2 0 0 0 5 6.2v9.6A2.2 2.2 0 0 0 7.2 18H8" />
  {:else if name === 'check'}
    <path d="m5.4 12.4 4.1 4.1 9.1-9.1" />
  {:else if name === 'open'}
    <path d="M14 5h5v5" />
    <path d="M19 5 10.2 13.8" />
    <rect x="5" y="9" width="10" height="10" rx="2.2" />
  {:else if name === 'github'}
    <path d="M12 4.2c-4 0-7.2 3.2-7.2 7.2 0 3.2 2.1 5.8 5 6.8v-2.4c-2.1.5-2.6-.9-2.6-.9-.4-.9-.8-1.1-.8-1.1-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.7-.2-3.5-.9-3.5-3.8 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2.1 0 0 .7-.2 2.2.8a7.5 7.5 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.5.8 1.2.8 2 0 2.9-1.8 3.6-3.6 3.8.3.2.6.8.6 1.5v2.6c2.9-1 5-3.6 5-6.8 0-4-3.2-7.2-7.2-7.2Z" />
  {:else if name === 'flag-en'}
    <defs>
      <clipPath id={clipId}>
        <circle cx="12" cy="12" r="9" />
      </clipPath>
    </defs>
    <g clip-path={`url(#${clipId})`} stroke="none">
      <circle cx="12" cy="12" r="9" fill="#22408c" />
      <path d="M3 5.2 5.2 3l15.8 15.8L18.8 21Z" fill="#fff" />
      <path d="M18.8 3 21 5.2 5.2 21 3 18.8Z" fill="#fff" />
      <path d="M3 6.4 6.4 3l14.6 14.6-3.4 3.4Z" fill="#d72b3f" />
      <path d="M17.6 3 21 6.4 6.4 21 3 17.6Z" fill="#d72b3f" />
      <rect x="10.2" y="3" width="3.6" height="18" fill="#fff" />
      <rect x="3" y="10.2" width="18" height="3.6" fill="#fff" />
      <rect x="10.8" y="3" width="2.4" height="18" fill="#d72b3f" />
      <rect x="3" y="10.8" width="18" height="2.4" fill="#d72b3f" />
    </g>
  {:else if name === 'flag-ru'}
    <defs>
      <clipPath id={clipId}>
        <circle cx="12" cy="12" r="9" />
      </clipPath>
    </defs>
    <g clip-path={`url(#${clipId})`} stroke="none">
      <circle cx="12" cy="12" r="9" fill="#fff" />
      <rect x="3" y="9" width="18" height="6" fill="#2746b3" />
      <rect x="3" y="15" width="18" height="6" fill="#d73d43" />
    </g>
  {:else if name === 'flag-hy'}
    <defs>
      <clipPath id={clipId}>
        <circle cx="12" cy="12" r="9" />
      </clipPath>
    </defs>
    <g clip-path={`url(#${clipId})`} stroke="none">
      <circle cx="12" cy="12" r="9" fill="#d94141" />
      <rect x="3" y="9" width="18" height="6" fill="#224fa4" />
      <rect x="3" y="15" width="18" height="6" fill="#f2a53a" />
    </g>
  {/if}
</svg>

<style>
  svg {
    display: block;
    flex: none;
  }
</style>
