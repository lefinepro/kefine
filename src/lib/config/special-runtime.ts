const SPECIAL_RUNTIME_ORIGINS = ['https://dev-proxy.col.pub'] as const;

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export function isSpecialRuntimeOrigin(origin: string): boolean {
  const normalizedOrigin = normalizeOrigin(origin);
  return SPECIAL_RUNTIME_ORIGINS.some((candidate) => normalizeOrigin(candidate) === normalizedOrigin);
}

export function isSpecialRuntimeHostname(hostname: string): boolean {
  return SPECIAL_RUNTIME_ORIGINS.some((origin) => {
    try {
      return new URL(origin).hostname === hostname;
    } catch {
      return false;
    }
  });
}
