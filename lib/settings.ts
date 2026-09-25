export type TextSize = 'normal' | 'large' | 'xlarge';

export type Settings = {
  textSize: TextSize;
  theme: 'light' | 'dark';
  autoSpeak: boolean;
  speechRate: 'slow' | 'normal';
  onboarded: boolean;
};

export const DEFAULTS: Settings = {
  textSize: 'normal',
  theme: 'light',
  autoSpeak: true,
  speechRate: 'normal',
  onboarded: false,
};

/** Multiplier applied to every font size (the --k CSS variable). */
export const SCALE: Record<TextSize, number> = { normal: 1, large: 1.15, xlarge: 1.3 };
export const RATE: Record<Settings['speechRate'], number> = { slow: 0.72, normal: 0.9 };

const KEY = 'bh-settings';

// The server is the source of truth; this copy only lets the first paint use the right size and colours.
export function cachedSettings(): Settings | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

export function cacheSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
