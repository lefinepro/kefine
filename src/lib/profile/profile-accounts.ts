import type { ProfileSocialLink, ProfileSocialLinkType } from '$lib/types/user';

const PROFILE_ACCOUNT_PRESENTATION: Record<ProfileSocialLinkType, { label: string; icon: string }> = {
  website: { label: 'Website', icon: 'mdi:web' },
  twitter: { label: 'X / Twitter', icon: 'ri:twitter-x-fill' },
  telegram: { label: 'Telegram', icon: 'mdi:telegram' },
  discord: { label: 'Discord', icon: 'mdi:discord' },
  linkedin: { label: 'LinkedIn', icon: 'mdi:linkedin' },
  github: { label: 'GitHub', icon: 'mdi:github' },
  instagram: { label: 'Instagram', icon: 'mdi:instagram' },
  youtube: { label: 'YouTube', icon: 'mdi:youtube' },
  wallet: { label: 'Wallet', icon: 'mdi:wallet-outline' },
  ens: { label: 'ENS', icon: 'mdi:hexagon-outline' },
  farcaster: { label: 'Farcaster', icon: 'mdi:radio-tower' },
  lens: { label: 'Lens', icon: 'mdi:camera-iris' },
  other: { label: 'Other', icon: 'mdi:link-variant' }
};

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'generic';

const PROFILE_ACCOUNT_TYPE_SET = new Set<ProfileSocialLinkType>(Object.keys(PROFILE_ACCOUNT_PRESENTATION) as ProfileSocialLinkType[]);

function normalizeHost(value: string): string {
  try {
    const normalized = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
    return new URL(normalized).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function resolveDetectedTypeFromHost(host: string): ProfileSocialLinkType | null {
  if (!host) {
    return null;
  }

  if (host === 'x.com' || host === 'twitter.com') {
    return 'twitter';
  }
  if (host === 't.me' || host === 'telegram.me') {
    return 'telegram';
  }
  if (host === 'discord.com' || host === 'discord.gg') {
    return 'discord';
  }
  if (host === 'linkedin.com') {
    return 'linkedin';
  }
  if (host === 'github.com') {
    return 'github';
  }
  if (host === 'instagram.com') {
    return 'instagram';
  }
  if (host === 'youtube.com' || host === 'youtu.be') {
    return 'youtube';
  }

  return host ? 'website' : null;
}

export function detectProfileAccountType(value: string): ProfileSocialLinkType | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'wallet';
  }
  if (/^[a-z0-9-]{1,64}\.eth$/i.test(trimmed)) {
    return 'ens';
  }
  if (/^[a-z0-9][a-z0-9-]{1,63}\.lens$/i.test(trimmed)) {
    return 'lens';
  }
  if (/^@?[a-z0-9][a-z0-9._-]{1,63}$/i.test(trimmed) && trimmed.startsWith('@')) {
    return 'farcaster';
  }

  return resolveDetectedTypeFromHost(normalizeHost(trimmed));
}

export function resolveProfileAccountPresentation(type: ProfileSocialLinkType, value: string, label?: string): {
  type: ProfileSocialLinkType;
  icon: string;
  label: string;
  href?: string;
  faviconUrl?: string;
} {
  const trimmed = value.trim();
  const detectedType = detectProfileAccountType(trimmed);
  const effectiveType = detectedType ?? type;
  const option = PROFILE_ACCOUNT_PRESENTATION[effectiveType] ?? PROFILE_ACCOUNT_PRESENTATION.other;
  const normalizedLabel = label?.trim() || option.label;
  const href = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : undefined;
  const hostname = href ? normalizeHost(href) : normalizeHost(trimmed);
  const faviconUrl = effectiveType === 'website' || href
    ? hostname
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
      : undefined
    : undefined;

  return {
    type: effectiveType,
    icon: option.icon,
    label: normalizedLabel,
    href,
    faviconUrl
  };
}

export function normalizeProfileAccount(
  account: Partial<ProfileSocialLink> & { id?: string; label?: string; value?: string; type?: string; url?: string }
): ProfileSocialLink | null {
  const id = typeof account.id === 'string' && account.id.trim() ? account.id.trim() : null;
  const legacyUrl = typeof account.url === 'string' ? account.url.trim() : '';
  const value = typeof account.value === 'string' && account.value.trim() ? account.value.trim() : legacyUrl;
  if (!id || !value) {
    return null;
  }

  const rawType = typeof account.type === 'string' && PROFILE_ACCOUNT_TYPE_SET.has(account.type as ProfileSocialLinkType)
    ? (account.type as ProfileSocialLinkType)
    : detectProfileAccountType(value) ?? 'other';
  const option = PROFILE_ACCOUNT_PRESENTATION[rawType] ?? PROFILE_ACCOUNT_PRESENTATION.other;
  const label = typeof account.label === 'string' && account.label.trim() ? account.label.trim() : option.label;

  return {
    id,
    type: rawType,
    value,
    label
  };
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digits = cardNumber.replace(/\D+/g, '');
  if (!digits) {
    return 'generic';
  }

  if (/^4\d{0,}$/.test(digits)) {
    return 'visa';
  }
  if (/^(34|37)\d{0,}$/.test(digits)) {
    return 'amex';
  }

  const two = Number(digits.slice(0, 2));
  const four = Number(digits.slice(0, 4));
  if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) {
    return 'mastercard';
  }

  return 'generic';
}

export function getCardBrandPresentation(cardNumber: string): { brand: CardBrand; icon: string; label: string } {
  const brand = detectCardBrand(cardNumber);
  if (brand === 'visa') {
    return { brand, icon: 'simple-icons:visa', label: 'Visa' };
  }
  if (brand === 'mastercard') {
    return { brand, icon: 'simple-icons:mastercard', label: 'Mastercard' };
  }
  if (brand === 'amex') {
    return { brand, icon: 'simple-icons:americanexpress', label: 'American Express' };
  }

  return { brand, icon: 'mdi:credit-card-outline', label: 'Card' };
}
