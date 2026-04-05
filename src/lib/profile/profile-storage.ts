import type {
  Profile,
  ProfileBonusLedgerEntry,
  ProfileCardVerification,
  ProfileFollow,
  ProfileSocialLinkType,
  ProfileTemplate,
  ProfileTemplateFile,
  ProfileTemplatePricingMode,
  ProfileTaskAccessRecord
} from '$lib/types/user';
import type { TaskAccessKind } from '$lib/types/user';
import { normalizeProfileAccount } from '$lib/profile/profile-accounts';
import {
  buildProfilePath,
  buildProfileTaskPath,
  deriveProfileUsername,
  deriveWalletProfileHandle,
  normalizeProfileUsername
} from '$lib/profile/profile-handles';

export {
  buildProfilePath,
  buildProfileTaskPath,
  deriveProfileUsername,
  deriveWalletProfileHandle,
  normalizeProfileUsername
} from '$lib/profile/profile-handles';

const PROFILE_STORAGE_KEY = 'kefine-profiles-v1';
const PROFILE_FOLLOW_STORAGE_KEY = 'kefine-profile-follows-v1';
const PROFILE_TASK_ACCESS_STORAGE_KEY = 'kefine-profile-task-access-v1';
const PROFILE_BONUS_LEDGER_STORAGE_KEY = 'kefine-profile-bonus-ledger-v1';
const PROFILE_TEMPLATE_STORAGE_KEY = 'kefine-profile-templates-v1';

const DEFAULT_REFERRAL_PERCENT = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function parseJsonArray(storage: Storage, key: string): unknown[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function createTemplateSlug(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 14)}`;
}

function readTemplateFiles(value: unknown): ProfileTemplateFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map<ProfileTemplateFile | null>((item) => {
      const name = toStringValue(item['name']);
      if (!name) {
        return null;
      }

      return {
        id: toStringValue(item['id']) || createId('template-file'),
        name,
        size: toNumberValue(item['size']),
        type: toStringValue(item['type'])
      };
    })
    .filter((item): item is ProfileTemplateFile => item !== null);
}

export function readProfiles(storage: Storage): Profile[] {
  return parseJsonArray(storage, PROFILE_STORAGE_KEY)
    .filter(isRecord)
    .map((item) => {
      const username = normalizeProfileUsername(toStringValue(item['username']) || 'user');
      const createdAt = toStringValue(item['createdAt']) || new Date().toISOString();
      const updatedAt = toStringValue(item['updatedAt']) || createdAt;
      const socialLinks = Array.isArray(item['socialLinks'])
        ? item['socialLinks']
            .filter(isRecord)
            .map((link) =>
              normalizeProfileAccount({
                id: toStringValue(link['id']) || createId('social'),
                type: toStringValue(link['type']) as ProfileSocialLinkType | undefined,
                label: toStringValue(link['label']),
                value: toStringValue(link['value']),
                url: toStringValue(link['url'])
              })
            )
            .filter((link): link is NonNullable<typeof link> => link !== null)
        : [];
      const cardRaw = isRecord(item['cardVerification']) ? item['cardVerification'] : null;
      const cardVerification: ProfileCardVerification | undefined = cardRaw
        ? {
            status:
              cardRaw['status'] === 'verified' || cardRaw['status'] === 'rejected'
                ? cardRaw['status']
                : 'unverified',
            bin: toStringValue(cardRaw['bin']) || '',
            last4: toStringValue(cardRaw['last4']) || '',
            scheme: toStringValue(cardRaw['scheme']),
            cardType: toStringValue(cardRaw['cardType']),
            bankName: toStringValue(cardRaw['bankName']),
            countryAlpha2: toStringValue(cardRaw['countryAlpha2']),
            countryName: toStringValue(cardRaw['countryName']),
            isArmenianBank: cardRaw['isArmenianBank'] === true,
            verifiedAt: toStringValue(cardRaw['verifiedAt']),
            bonusGrantedAt: toStringValue(cardRaw['bonusGrantedAt']),
            rejectionReason: toStringValue(cardRaw['rejectionReason'])
          }
        : undefined;

      return {
        id: toStringValue(item['id']) || createId('profile'),
        userId: toStringValue(item['userId']) || createId('user'),
        username,
        primaryHandle: normalizeProfileUsername(toStringValue(item['primaryHandle']) || username),
        primaryHandleType:
          item['primaryHandleType'] === 'wallet-address' ||
          item['primaryHandleType'] === 'wallet-alias' ||
          item['primaryHandleType'] === 'passkey'
            ? item['primaryHandleType']
            : 'email',
        displayName: toStringValue(item['displayName']) || username,
        email: toStringValue(item['email']),
        avatarUrl: toStringValue(item['avatarUrl']),
        walletAddress: toStringValue(item['walletAddress']),
        walletAlias: toStringValue(item['walletAlias']),
        bio: toStringValue(item['bio']) || '',
        isPublic: item['isPublic'] === true,
        socialLinks,
        referralPercent: toNumberValue(item['referralPercent']) ?? DEFAULT_REFERRAL_PERCENT,
        bonusBalanceUsd: toNumberValue(item['bonusBalanceUsd']) ?? 0,
        followersCount: toNumberValue(item['followersCount']) ?? 0,
        followingCount: toNumberValue(item['followingCount']) ?? 0,
        cardVerification,
        createdAt,
        updatedAt,
        metadata: isRecord(item['metadata']) ? item['metadata'] : undefined
      };
    });
}

export function writeProfiles(storage: Storage, profiles: Profile[]): void {
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
}

export function readProfileFollows(storage: Storage): ProfileFollow[] {
  return parseJsonArray(storage, PROFILE_FOLLOW_STORAGE_KEY)
    .filter(isRecord)
    .map((item) => {
      const followerProfileId = toStringValue(item['followerProfileId']);
      const targetProfileId = toStringValue(item['targetProfileId']);
      if (!followerProfileId || !targetProfileId) {
        return null;
      }

      return {
        followerProfileId,
        targetProfileId,
        createdAt: toStringValue(item['createdAt']) || new Date().toISOString()
      };
    })
    .filter((item): item is ProfileFollow => item !== null);
}

export function writeProfileFollows(storage: Storage, follows: ProfileFollow[]): void {
  storage.setItem(PROFILE_FOLLOW_STORAGE_KEY, JSON.stringify(follows));
}

export function readTaskAccessRecords(storage: Storage): ProfileTaskAccessRecord[] {
  return parseJsonArray(storage, PROFILE_TASK_ACCESS_STORAGE_KEY)
    .filter(isRecord)
    .map((item) => {
      const orderId = toStringValue(item['orderId']);
      const ownerProfileId = toStringValue(item['ownerProfileId']);
      const buyerProfileId = toStringValue(item['buyerProfileId']);
      const kind = item['kind'];
      if (
        !orderId ||
        !ownerProfileId ||
        !buyerProfileId ||
        (kind !== 'view' && kind !== 'watch' && kind !== 'join')
      ) {
        return null;
      }

      return {
        orderId,
        ownerProfileId,
        buyerProfileId,
        kind,
        priceUsd: toNumberValue(item['priceUsd']) ?? 0,
        createdAt: toStringValue(item['createdAt']) || new Date().toISOString()
      };
    })
    .filter((item): item is ProfileTaskAccessRecord => item !== null);
}

export function writeTaskAccessRecords(storage: Storage, records: ProfileTaskAccessRecord[]): void {
  storage.setItem(PROFILE_TASK_ACCESS_STORAGE_KEY, JSON.stringify(records));
}

export function readProfileBonusLedger(storage: Storage): ProfileBonusLedgerEntry[] {
  return parseJsonArray(storage, PROFILE_BONUS_LEDGER_STORAGE_KEY)
    .filter(isRecord)
    .map<ProfileBonusLedgerEntry | null>((item) => {
      const profileId = toStringValue(item['profileId']);
      const source = item['source'];
      const note = toStringValue(item['note']);
      const amountUsd = toNumberValue(item['amountUsd']);
      if (
        !profileId ||
        !note ||
        amountUsd === undefined ||
        (source !== 'card-verification' && source !== 'follower-task' && source !== 'template-order')
      ) {
        return null;
      }

      return {
        id: toStringValue(item['id']) || createId('bonus'),
        profileId,
        amountUsd,
        source,
        createdAt: toStringValue(item['createdAt']) || new Date().toISOString(),
        note,
        orderId: toStringValue(item['orderId'])
      };
    })
    .filter((item): item is ProfileBonusLedgerEntry => item !== null);
}

export function writeProfileBonusLedger(storage: Storage, entries: ProfileBonusLedgerEntry[]): void {
  storage.setItem(PROFILE_BONUS_LEDGER_STORAGE_KEY, JSON.stringify(entries));
}

export function readProfileTemplates(storage: Storage): ProfileTemplate[] {
  const templates = parseJsonArray(storage, PROFILE_TEMPLATE_STORAGE_KEY)
    .filter(isRecord)
    .map<ProfileTemplate | null>((item) => {
      const profileId = toStringValue(item['profileId']);
      const title = toStringValue(item['title']);
      if (!profileId || !title) {
        return null;
      }

      const createdAt = toStringValue(item['createdAt']) || new Date().toISOString();
      return {
        id: toStringValue(item['id']) || createId('template'),
        profileId,
        authorHandle: toStringValue(item['authorHandle']) || undefined,
        authorDisplayName: toStringValue(item['authorDisplayName']) || undefined,
        slug: (() => {
          const storedSlug = toStringValue(item['slug']);
          return storedSlug && isUuidLike(storedSlug) ? storedSlug : createTemplateSlug();
        })(),
        title,
        description: toStringValue(item['description']) || '',
        prefillTitle: toStringValue(item['prefillTitle']) || '',
        prefillDescription: toStringValue(item['prefillDescription']) || '',
        prefillEstimatedCost: toNumberValue(item['prefillEstimatedCost']),
        prefillCurrency: toStringValue(item['prefillCurrency']) || undefined,
        prefillFiles: readTemplateFiles(item['prefillFiles']),
        pricingMode: item['pricingMode'] === 'percent' ? 'percent' : 'fixed',
        pricingValue: Math.max(0, toNumberValue(item['pricingValue']) ?? 0),
        isPublished: item['isPublished'] === true,
        createdAt,
        updatedAt: toStringValue(item['updatedAt']) || createdAt
      };
    })
    .filter((item): item is ProfileTemplate => item !== null);

  const raw = storage.getItem(PROFILE_TEMPLATE_STORAGE_KEY);
  if (raw !== JSON.stringify(templates)) {
    writeProfileTemplates(storage, templates);
  }

  return templates;
}

export function writeProfileTemplates(storage: Storage, templates: ProfileTemplate[]): void {
  storage.setItem(PROFILE_TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

export function getProfileTemplateById(storage: Storage, templateId: string): ProfileTemplate | null {
  return readProfileTemplates(storage).find((template) => template.id === templateId) ?? null;
}

export function getProfileTemplateBySlug(storage: Storage, profileId: string, slug: string): ProfileTemplate | null {
  const normalized = slug.trim();
  return readProfileTemplates(storage).find((template) => template.profileId === profileId && template.slug === normalized) ?? null;
}

export function listProfileTemplates(storage: Storage, profileId: string): ProfileTemplate[] {
  return readProfileTemplates(storage)
    .filter((template) => template.profileId === profileId)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function calculateTemplateAmounts(args: {
  orderEstimatedCost: number;
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
}): { feeUsd: number; netUsd: number } {
  const baseAmount = Math.max(0, Number.isFinite(args.orderEstimatedCost) ? args.orderEstimatedCost : 0);
  const rawFee =
    args.pricingMode === 'percent'
      ? (baseAmount * Math.max(0, args.pricingValue)) / 100
      : Math.max(0, args.pricingValue);
  const feeUsd = Number(Math.min(baseAmount, rawFee).toFixed(2));
  return {
    feeUsd,
    netUsd: Number(Math.max(0, baseAmount - feeUsd).toFixed(2))
  };
}

export function upsertProfileTemplate(args: {
  storage: Storage;
  profileId: string;
  templateId?: string;
  title: string;
  description: string;
  prefillTitle: string;
  prefillDescription: string;
  prefillEstimatedCost?: number;
  prefillCurrency?: string;
  prefillFiles?: ProfileTemplateFile[];
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
  isPublished: boolean;
}): ProfileTemplate {
  const current = readProfileTemplates(args.storage);
  const existing = args.templateId ? current.find((item) => item.id === args.templateId && item.profileId === args.profileId) : null;
  const createdAt = existing?.createdAt || new Date().toISOString();
  const next: ProfileTemplate = {
    id: existing?.id || createId('template'),
    profileId: args.profileId,
    slug: existing?.slug && isUuidLike(existing.slug) ? existing.slug : createTemplateSlug(),
    title: args.title.trim() || 'Untitled template',
    description: args.description.trim(),
    prefillTitle: args.prefillTitle.trim(),
    prefillDescription: args.prefillDescription.trim(),
    prefillEstimatedCost:
      args.prefillEstimatedCost !== undefined && Number.isFinite(args.prefillEstimatedCost) ? Math.max(0, args.prefillEstimatedCost) : undefined,
    prefillCurrency: args.prefillCurrency?.trim() || undefined,
    prefillFiles: [...(args.prefillFiles ?? [])],
    pricingMode: args.pricingMode,
    pricingValue: Math.max(0, Number(args.pricingValue) || 0),
    isPublished: args.isPublished,
    createdAt,
    updatedAt: new Date().toISOString()
  };

  writeProfileTemplates(
    args.storage,
    existing ? current.map((item) => (item.id === existing.id ? next : item)) : [next, ...current]
  );
  return next;
}

export function deleteProfileTemplate(storage: Storage, profileId: string, templateId: string): ProfileTemplate[] {
  const next = readProfileTemplates(storage).filter((template) => !(template.profileId === profileId && template.id === templateId));
  writeProfileTemplates(storage, next);
  return next;
}

export function ensureProfileForSession(args: {
  storage: Storage;
  userId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  authType?: 'wallet' | 'email' | 'passkey' | 'localhost' | null;
  walletAddress?: string | null;
  walletAlias?: string | null;
}): Profile {
  const profiles = readProfiles(args.storage);
  const normalizedEmail = args.email?.trim().toLowerCase();
  const normalizedWalletAddress = args.walletAddress?.trim().toLowerCase();
  const walletFirstHandle = normalizedWalletAddress
    ? deriveWalletProfileHandle(normalizedWalletAddress, args.walletAlias)
    : null;
  const existing =
    profiles.find((profile) => profile.userId === args.userId) ||
    profiles.find((profile) => normalizedEmail && profile.email?.trim().toLowerCase() === normalizedEmail) ||
    profiles.find((profile) => normalizedWalletAddress && profile.walletAddress?.trim().toLowerCase() === normalizedWalletAddress);

  if (existing) {
    const nextPrimaryHandle = walletFirstHandle || existing.primaryHandle || existing.username;
    const nextPrimaryHandleType = walletFirstHandle
      ? (args.walletAlias ? 'wallet-alias' : 'wallet-address')
      : existing.primaryHandleType;
    const nextProfile: Profile = {
      ...existing,
      username: nextPrimaryHandle,
      primaryHandle: nextPrimaryHandle,
      primaryHandleType: nextPrimaryHandleType,
      email: args.email?.trim() || existing.email,
      displayName: args.displayName?.trim() || existing.displayName,
      avatarUrl: args.avatarUrl?.trim() || existing.avatarUrl,
      walletAddress: normalizedWalletAddress || existing.walletAddress,
      walletAlias: args.walletAlias?.trim() || existing.walletAlias,
      updatedAt: new Date().toISOString()
    };

    writeProfiles(
      args.storage,
      profiles.map((profile) => (profile.id === existing.id ? nextProfile : profile))
    );
    return nextProfile;
  }

  const now = new Date().toISOString();
  const baseUsername = deriveProfileUsername({
    email: args.email,
    displayName: args.displayName,
    fallback: args.userId
  });
  const username = createUniqueUsername(walletFirstHandle || baseUsername, profiles);
  const primaryHandleType =
    walletFirstHandle ? (args.walletAlias ? 'wallet-alias' : 'wallet-address') : args.authType === 'passkey' ? 'passkey' : 'email';
  const profile: Profile = {
    id: createId('profile'),
    userId: args.userId,
    username,
    primaryHandle: username,
    primaryHandleType,
    displayName: args.displayName?.trim() || username,
    email: args.email?.trim() || undefined,
    avatarUrl: args.avatarUrl?.trim() || undefined,
    walletAddress: normalizedWalletAddress || undefined,
    walletAlias: args.walletAlias?.trim() || undefined,
    bio: '',
    isPublic: false,
    socialLinks: [],
    referralPercent: DEFAULT_REFERRAL_PERCENT,
    bonusBalanceUsd: 0,
    followersCount: 0,
    followingCount: 0,
    createdAt: now,
    updatedAt: now
  };

  writeProfiles(args.storage, [profile, ...profiles]);
  return profile;
}

export function createUniqueUsername(seed: string, profiles: Profile[]): string {
  const normalizedSeed = normalizeProfileUsername(seed);
  const existing = new Set(profiles.map((profile) => profile.primaryHandle || profile.username));
  if (!existing.has(normalizedSeed)) {
    return normalizedSeed;
  }

  let index = 2;
  while (existing.has(`${normalizedSeed}-${index}`)) {
    index += 1;
  }

  return `${normalizedSeed}-${index}`;
}

export function updateStoredProfile(storage: Storage, profileId: string, updater: (profile: Profile) => Profile): Profile | null {
  const profiles = readProfiles(storage);
  const current = profiles.find((profile) => profile.id === profileId);
  if (!current) {
    return null;
  }

  const next = {
    ...updater(current),
    updatedAt: new Date().toISOString()
  };
  writeProfiles(
    storage,
    profiles.map((profile) => (profile.id === profileId ? next : profile))
  );
  return next;
}

export function getProfileByUsername(storage: Storage, rawHandle: string): Profile | null {
  const username = normalizeProfileUsername(rawHandle.replace(/^@+/, ''));
  return readProfiles(storage).find((profile) => (profile.primaryHandle || profile.username) === username) ?? null;
}

export function getProfileById(storage: Storage, profileId: string): Profile | null {
  return readProfiles(storage).find((profile) => profile.id === profileId) ?? null;
}

export function isFollowingProfile(storage: Storage, followerProfileId: string, targetProfileId: string): boolean {
  return readProfileFollows(storage).some(
    (follow) => follow.followerProfileId === followerProfileId && follow.targetProfileId === targetProfileId
  );
}

export function followProfile(storage: Storage, followerProfileId: string, targetProfileId: string): {
  profiles: Profile[];
  follows: ProfileFollow[];
} {
  if (!followerProfileId || !targetProfileId || followerProfileId === targetProfileId) {
    return {
      profiles: readProfiles(storage),
      follows: readProfileFollows(storage)
    };
  }

  const profiles = readProfiles(storage);
  const follows = readProfileFollows(storage);
  if (
    follows.some(
      (follow) => follow.followerProfileId === followerProfileId && follow.targetProfileId === targetProfileId
    )
  ) {
    return { profiles, follows };
  }

  const nextFollows = [
    {
      followerProfileId,
      targetProfileId,
      createdAt: new Date().toISOString()
    },
    ...follows
  ];
  const nextProfiles = profiles.map((profile) => {
    if (profile.id === targetProfileId) {
      return { ...profile, followersCount: profile.followersCount + 1, updatedAt: new Date().toISOString() };
    }

    if (profile.id === followerProfileId) {
      return { ...profile, followingCount: profile.followingCount + 1, updatedAt: new Date().toISOString() };
    }

    return profile;
  });

  writeProfileFollows(storage, nextFollows);
  writeProfiles(storage, nextProfiles);
  return { profiles: nextProfiles, follows: nextFollows };
}

export function grantTaskAccess(args: {
  storage: Storage;
  orderId: string;
  ownerProfileId: string;
  buyerProfileId: string;
  kind: TaskAccessKind;
  priceUsd: number;
}): ProfileTaskAccessRecord[] {
  const current = readTaskAccessRecords(args.storage);
  const alreadyGranted = current.some(
    (record) =>
      record.orderId === args.orderId &&
      record.ownerProfileId === args.ownerProfileId &&
      record.buyerProfileId === args.buyerProfileId &&
      record.kind === args.kind
  );

  if (alreadyGranted) {
    return current;
  }

  const next = [
    {
      orderId: args.orderId,
      ownerProfileId: args.ownerProfileId,
      buyerProfileId: args.buyerProfileId,
      kind: args.kind,
      priceUsd: args.priceUsd,
      createdAt: new Date().toISOString()
    },
    ...current
  ];
  writeTaskAccessRecords(args.storage, next);
  return next;
}

export function getGrantedTaskAccessKinds(args: {
  storage: Storage;
  orderId: string;
  ownerProfileId: string;
  buyerProfileId: string;
}): TaskAccessKind[] {
  return readTaskAccessRecords(args.storage)
    .filter(
      (record) =>
        record.orderId === args.orderId &&
        record.ownerProfileId === args.ownerProfileId &&
        record.buyerProfileId === args.buyerProfileId
    )
    .map((record) => record.kind);
}

export function addProfileBonus(args: {
  storage: Storage;
  profileId: string;
  amountUsd: number;
  source: 'card-verification' | 'follower-task' | 'template-order';
  note: string;
  orderId?: string;
}): Profile | null {
  const entries = readProfileBonusLedger(args.storage);
  const profile = updateStoredProfile(args.storage, args.profileId, (current) => ({
    ...current,
    bonusBalanceUsd: Number((current.bonusBalanceUsd + args.amountUsd).toFixed(2))
  }));
  if (!profile) {
    return null;
  }

  writeProfileBonusLedger(args.storage, [
    {
      id: createId('bonus'),
      profileId: args.profileId,
      amountUsd: args.amountUsd,
      source: args.source,
      note: args.note,
      orderId: args.orderId,
      createdAt: new Date().toISOString()
    },
    ...entries
  ]);

  return profile;
}
