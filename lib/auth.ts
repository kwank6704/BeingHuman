import { getUserId } from './user';

/**
 * LINE login through LIFF. With NEXT_PUBLIC_LIFF_ID set, the app logs in with LINE and sends the
 * LIFF ID token to the API, which checks it with LINE — so the book belongs to the elder's LINE
 * account and survives a new phone or cleared browser data. Without it (local development) the
 * API is told a device id instead (see user.ts).
 */
export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';

/**
 * "?demo" in the address opens the shared sample book without LINE, for presentations.
 * The backend must allow it (ALLOW_DEVICE_IDS=true when LINE login is on).
 */
const isDemo = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo');
const useLine = () => !!LIFF_ID && !isDemo();

const RELOGIN_KEY = 'bh-relogin-at';
let idToken: string | null = null;
let ready: Promise<'ok' | 'redirecting'> | null = null;

const loadLiff = async () => (await import('@line/liff')).default;

const BOUNCE_KEY = 'bh-liff-bounce-at';

/** True if we sent this tab to the LIFF URL a moment ago (and so should not do it again). */
function bouncedRecently(): boolean {
  try {
    const last = Number(sessionStorage.getItem(BOUNCE_KEY) || 0);
    sessionStorage.setItem(BOUNCE_KEY, String(Date.now()));
    return Date.now() - last < 60_000;
  } catch {
    return true;
  }
}

/** Logs in with LINE if needed. Resolves 'redirecting' when the page is about to leave for LINE's login. */
export function initAuth(): Promise<'ok' | 'redirecting'> {
  ready ??= (async () => {
    if (!useLine()) return 'ok';
    const liff = await loadLiff();
    await liff.init({ liffId: LIFF_ID });
    // Inside the LINE app this is already true.
    if (!liff.isLoggedIn()) {
      // On a phone, LINE's web login hands off to the LINE app and often never comes back to the
      // browser. Open the app inside LINE instead (the LIFF URL), where LINE logs in by itself.
      // If that link lands back in this browser (LINE not installed), use the web login.
      if (liff.getOS() !== 'web' && !bouncedRecently()) {
        location.replace('https://liff.line.me/' + LIFF_ID);
        return 'redirecting';
      }
      liff.login({ redirectUri: location.href });
      return 'redirecting';
    }
    idToken = liff.getIDToken();
    if (!idToken) throw new Error('LIFF app is missing the openid scope');
    return 'ok';
  })();
  ready.catch(() => { ready = null; }); // let "ลองใหม่" try again
  return ready;
}

export function authHeaders(): Record<string, string> {
  if (isDemo()) return { 'X-User-Id': 'demo' };
  return useLine() ? (idToken ? { Authorization: 'Bearer ' + idToken } : {}) : { 'X-User-Id': getUserId() };
}

/**
 * The API refused our token (ID tokens expire). Log in again once to get a fresh one; returns false
 * if we already tried a moment ago, so a broken setup shows an error instead of looping.
 */
export async function relogin(): Promise<boolean> {
  if (!useLine()) return false;
  try {
    const last = Number(sessionStorage.getItem(RELOGIN_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOGIN_KEY, String(Date.now()));
  } catch {
    return false;
  }
  const liff = await loadLiff();
  liff.logout();
  // The LINE app logs in again by itself when the page reloads; other browsers go through LINE's login page.
  if (liff.isInClient()) location.reload();
  else liff.login({ redirectUri: location.href });
  return true;
}
