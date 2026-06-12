/**
 * Helpers for the small stacked solver avatars shown next to each task in the
 * solvers view. Avatars are rendered purely from the solver name so the same
 * solver always gets the same initials and colour without needing an image.
 */

/** Two-letter initials derived from a solver name, e.g. `Go Proxy Pro` → `GP`. */
export function solverInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  const first = parts[0][0] ?? '';
  const last = parts[parts.length - 1][0] ?? '';
  return `${first}${last}`.toUpperCase();
}

/** Deterministic hue (0–359) for a solver name, stable across reloads. */
export function solverAvatarHue(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }

  return ((hash % 360) + 360) % 360;
}

/** A readable avatar background colour derived from the solver name. */
export function solverAvatarColor(seed: string): string {
  return `hsl(${solverAvatarHue(seed)} 52% 52%)`;
}

export type SolverAvatar = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

/**
 * Build avatar descriptors for a list of solvers, keeping at most `limit`
 * visible. The returned `overflow` count is the number of solvers that did not
 * fit so the caller can render a trailing `+N` badge.
 */
export function buildSolverAvatars(
  solvers: ReadonlyArray<{ id: string; solver: string }>,
  limit = 4
): { avatars: SolverAvatar[]; overflow: number } {
  const avatars = solvers.slice(0, limit).map((entry) => ({
    id: entry.id,
    name: entry.solver,
    initials: solverInitials(entry.solver),
    color: solverAvatarColor(entry.solver)
  }));

  return {
    avatars,
    overflow: Math.max(0, solvers.length - avatars.length)
  };
}
