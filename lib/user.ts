const KEY = 'bh-user-id';
let cached: string | null = null;

/**
 * Who the API should treat as the current elder when LINE login is off (see auth.ts).
 * NEXT_PUBLIC_USER_ID pins it (e.g. "demo" for the seeded data); otherwise a
 * device id is created once and kept in localStorage.
 */
export function getUserId(): string {
  if (cached) return cached;
  const pinned = process.env.NEXT_PUBLIC_USER_ID;
  if (pinned) return (cached = pinned);
  try {
    cached = localStorage.getItem(KEY);
    if (!cached) {
      cached = crypto.randomUUID();
      localStorage.setItem(KEY, cached);
    }
  } catch {
    cached ??= crypto.randomUUID();
  }
  return cached;
}
