export const KEFINE_WALLET_PROVIDERS = [
  { icon: 'logos:metamask-icon', label: 'MetaMask', className: 'is-metamask' },
  { icon: 'simple-icons:walletconnect', label: 'WalletConnect', className: 'is-walletconnect' },
  { icon: 'material-symbols:alternate-email-rounded', label: 'Email', className: 'is-email' },
  { icon: 'logos:google-icon', label: 'Google', className: 'is-google' }
] as const;

export const KEFINE_AUTH_ICONS = {
  passkey: 'mdi:fingerprint',
  anonymous: 'mdi:incognito'
} as const;
