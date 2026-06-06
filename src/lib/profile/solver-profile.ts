import type { Profile, ProfileMetadata } from '$lib/types/user';
import { buildProfilePath, updateStoredProfile } from '$lib/profile/profile-storage';

export const SOLVER_RELAY_ORIGIN = 'http://127.0.0.1:4501';
export const SOLVER_RESPONSES_ENDPOINT = `${SOLVER_RELAY_ORIGIN}/api/responses`;

export interface SolverProfileConnection {
  token: string;
  solverHandle: string;
  created: boolean;
  inboxEndpoint: string;
  responsesEndpoint: string;
  authorizationHeader: string;
}

export function buildSolverProfilePath(username: string): string {
  return `${buildProfilePath(username)}/solver`;
}

export function resolveSolverProfileConnection(profile: Profile | null): SolverProfileConnection {
  const metadata = (profile?.metadata ?? {}) as ProfileMetadata;
  const token = typeof metadata.solverProfileToken === 'string' ? metadata.solverProfileToken.trim() : '';
  const solverHandle = typeof metadata.solverProfileHandle === 'string' ? metadata.solverProfileHandle.trim() : '';

  return {
    token,
    solverHandle,
    created: Boolean(token),
    inboxEndpoint: solverHandle
      ? `${SOLVER_RELAY_ORIGIN}/solvers/${solverHandle}/inbox`
      : `${SOLVER_RELAY_ORIGIN}/solvers/.../inbox`,
    responsesEndpoint: SOLVER_RESPONSES_ENDPOINT,
    authorizationHeader: token ? `Authorization: Bearer ${token}` : 'Authorization: Bearer lepos_solver_...'
  };
}

export function createRandomSolverSlug(length: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const values = crypto.getRandomValues(new Uint32Array(length));
    return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
  }

  let slug = '';
  while (slug.length < length) {
    slug += Math.random().toString(36).slice(2);
  }
  return slug.slice(0, length);
}

export function ensureStoredSolverProfile(storage: Storage, profile: Profile): Profile | null {
  return updateStoredProfile(storage, profile.id, (current) => {
    const metadata = (current.metadata ?? {}) as ProfileMetadata;
    const storedToken = typeof metadata.solverProfileToken === 'string' ? metadata.solverProfileToken.trim() : '';
    const storedHandle = typeof metadata.solverProfileHandle === 'string' ? metadata.solverProfileHandle.trim() : '';
    const randomHandle = `solver-${createRandomSolverSlug(8)}`;

    return {
      ...current,
      metadata: {
        ...metadata,
        solverProfileId:
          typeof metadata.solverProfileId === 'string' && metadata.solverProfileId.trim()
            ? metadata.solverProfileId.trim()
            : `solver-profile:${current.id}`,
        solverProfileHandle: storedHandle || randomHandle,
        solverProfileToken: storedToken || `lepos_solver_${createRandomSolverSlug(32)}`,
        solverProfileCreatedAt:
          typeof metadata.solverProfileCreatedAt === 'string' && metadata.solverProfileCreatedAt.trim()
            ? metadata.solverProfileCreatedAt.trim()
            : new Date().toISOString()
      }
    };
  });
}
