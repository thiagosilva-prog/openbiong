const DEFAULT_MAX_LENGTH = 512;

// Attribution values (UTM params, ad click-ids, geo header values) come from
// public, unauthenticated, high-traffic endpoints. Truncate defensively before
// storage instead of validating/rejecting at the API boundary.
export function truncate(
  value: string | undefined,
  max = DEFAULT_MAX_LENGTH
): string | undefined {
  if (!value) {
    return undefined;
  }
  return value.length > max ? value.slice(0, max) : value;
}

// x-vercel-ip-city is URI-encoded (e.g. "San%20Francisco"). A malformed
// sequence must not throw and break the caller's request.
export function decodeCityHeader(
  value: string | null | undefined
): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
