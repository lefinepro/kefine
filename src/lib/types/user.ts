export interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export type ProfileSocialLinkType =
  | 'website'
  | 'twitter'
  | 'telegram'
  | 'discord'
  | 'linkedin'
  | 'github'
  | 'instagram'
  | 'youtube'
  | 'wallet'
  | 'ens'
  | 'farcaster'
  | 'lens'
  | 'other';

export interface ProfileSocialLink {
  id: string;
  type: ProfileSocialLinkType;
  value: string;
  label?: string;
}

export interface ProfileTemplateFile {
  id: string;
  name: string;
  size?: number;
  type?: string;
}

export type ProfileTemplatePricingMode = 'fixed' | 'percent';

export interface ProfileTemplate {
  id: string;
  profileId: string;
  authorHandle?: string;
  authorDisplayName?: string;
  slug: string;
  title: string;
  description: string;
  prefillTitle: string;
  prefillDescription: string;
  prefillEstimatedCost?: number;
  prefillCurrency?: string;
  prefillFiles: ProfileTemplateFile[];
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProfileCardVerificationStatus = 'unverified' | 'verified' | 'rejected';

export interface ProfileCardVerification {
  status: ProfileCardVerificationStatus;
  bin: string;
  last4: string;
  scheme?: string;
  cardType?: string;
  bankName?: string;
  countryAlpha2?: string;
  countryName?: string;
  isArmenianBank: boolean;
  verifiedAt?: string;
  bonusGrantedAt?: string;
  rejectionReason?: string;
}

export interface ProfileMetadata extends Record<string, unknown> {
  firstName?: string;
  surname?: string;
  profileSetupStep?: 'identity' | 'card' | 'socials' | 'done';
  profileSetupCompleted?: boolean;
  cardBonusEligible?: boolean;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  primaryHandle: string;
  primaryHandleType: 'wallet-address' | 'wallet-alias' | 'email' | 'passkey';
  displayName: string;
  email?: string;
  avatarUrl?: string;
  walletAddress?: string;
  walletAlias?: string;
  bio: string;
  isPublic: boolean;
  socialLinks: ProfileSocialLink[];
  referralPercent: number;
  bonusBalanceUsd: number;
  followersCount: number;
  followingCount: number;
  cardVerification?: ProfileCardVerification;
  createdAt: string;
  updatedAt: string;
  metadata?: ProfileMetadata;
}

export interface ProfileFollow {
  followerProfileId: string;
  targetProfileId: string;
  createdAt: string;
}

export type TaskAccessKind = 'view' | 'watch' | 'join';

export interface ProfileTaskAccessRecord {
  orderId: string;
  ownerProfileId: string;
  buyerProfileId: string;
  kind: TaskAccessKind;
  priceUsd: number;
  createdAt: string;
}

export interface ProfileBonusLedgerEntry {
  id: string;
  profileId: string;
  amountUsd: number;
  source: 'card-verification' | 'follower-task' | 'template-order';
  createdAt: string;
  note: string;
  orderId?: string;
}

export interface CreateUserRequest {
  username: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;
