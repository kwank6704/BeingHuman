'use client';

/**
 * Pictures drawn in code (SVG / canvas), so they stay sharp on any phone, cost no downloads,
 * and can change with the data: the sky follows the time of day, the tree grows with the streak,
 * the waveform follows the elder's voice. All decoration is aria-hidden.
 */

import { useEffect, useId, useMemo, useRef, type CSSProperties } from 'react';

/** Small deterministic random numbers, so a drawing looks the same on every render. */
export function rng(seed: number | string) {
  let a = typeof seed === 'number' ? seed : [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── icons (line icons, sized in em so they follow the button's text size) ──

const ICONS = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
  camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
  image: <><rect width="18" height="18" x="3" y="3" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></>,
  album: <><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /><path d="M9 7h6M9 11h4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  play: <path d="M7 4v16l13-8z" fill="currentColor" />,
  pause: <><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" /></>,
  stop: <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" /></>,
  heart: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  heartFill: <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" fill="currentColor" />,
  send: <><path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" /></>,
  pencil: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
  trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  sliders: <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />,
  left: <path d="m15 18-6-6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  rotate: <><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.7L21 8" /><path d="M21 3v5h-5" /></>,
  expand: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  undo: <><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></>,
  home: <><path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></>,
  speaker: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></>,
  flower: <><circle cx="12" cy="12" r="2.6" fill="currentColor" /><path d="M12 9.4c-1.6-3.2-.2-6.4 0-6.4s1.6 3.2 0 6.4M14.6 12c3.2-1.6 6.4-.2 6.4 0s-3.2 1.6-6.4 0M12 14.6c1.6 3.2.2 6.4 0 6.4s-1.6-3.2 0-6.4M9.4 12c-3.2 1.6-6.4.2-6.4 0s3.2-1.6 6.4 0" /></>,
  more: <><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = '1.15em', style }: { name: IconName; size?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flex: 'none', ...style }}>
      {ICONS[name]}
    </svg>
  );
}

// ── the sky over the home screen ──

type Phase = 'morning' | 'day' | 'evening' | 'night';
const SKY: Record<Phase, { top: string; bottom: string; back: string; front: string; sun: string }> = {
  morning: { top: '#B9DDF2', bottom: '#FFEAD0', back: '#BCD6A6', front: '#8DB880', sun: '#FFC84A' },
  day: { top: '#86C6EA', bottom: '#E3F3FA', back: '#A8CF94', front: '#78AE6A', sun: '#FFD45A' },
  evening: { top: '#EE8E5C', bottom: '#FFD7A0', back: '#C99A73', front: '#9C7457', sun: '#FF8547' },
  night: { top: '#16203D', bottom: '#384673', back: '#2B3A52', front: '#1D2A3E', sun: '#F7EFCF' },
};

export function phaseOf(hour: number): Phase {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'day';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
}

/** A little landscape whose sky, sun and lights follow the clock. */
export function SkyScene({ now = new Date() }: { now?: Date }) {
  const id = useId().replace(/:/g, '');
  const h = now.getHours() + now.getMinutes() / 60;
  const phase = phaseOf(now.getHours());
  const c = SKY[phase];
  const t = Math.min(1, Math.max(0, (h - 5.5) / 13.5));
  const sun = phase === 'night' ? { x: 172, y: 84 } : { x: 36 + t * 328, y: 124 - Math.sin(Math.PI * t) * 64 };
  const stars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 22 }, () => ({ x: r() * 400, y: r() * 90, s: 0.6 + r() * 1.3, d: r() * 3 }));
  }, []);
  const night = phase === 'night';

  return (
    <svg className="mb-sky" viewBox="0 0 400 170" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id + 'sky'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.top} />
          <stop offset="1" stopColor={c.bottom} />
        </linearGradient>
        <radialGradient id={id + 'glow'}>
          <stop offset="0" stopColor={c.sun} stopOpacity=".55" />
          <stop offset="1" stopColor={c.sun} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="170" fill={`url(#${id}sky)`} />
      {night && stars.map((s, i) => (
        <circle key={i} className="mb-twinkle" cx={s.x} cy={s.y} r={s.s} fill="#FFF8E1" style={{ animationDelay: s.d + 's' }} />
      ))}
      <circle cx={sun.x} cy={sun.y} r="46" fill={`url(#${id}glow)`} />
      {night ? (
        <g>
          <circle cx={sun.x} cy={sun.y} r="15" fill={c.sun} />
          <circle cx={sun.x + 7} cy={sun.y - 5} r="13" fill={c.top} />
        </g>
      ) : (
        <circle cx={sun.x} cy={sun.y} r="17" fill={c.sun} />
      )}
      {!night && (
        <>
          <g className="mb-drift" style={{ animationDuration: '46s' }} opacity=".9">
            <Cloud x={60} y={38} s={1} />
          </g>
          <g className="mb-drift" style={{ animationDuration: '70s', animationDelay: '-30s' }} opacity=".75">
            <Cloud x={220} y={62} s={0.7} />
          </g>
        </>
      )}
      <path d="M0 118 C 70 92, 140 108, 210 96 S 330 78, 400 100 V170 H0Z" fill={c.back} />
      {/* a small house on the far hill; its window lights up after dark */}
      <g transform="translate(288 74)">
        <path d="M0 22 L16 8 L32 22 Z" fill={night ? '#2E4461' : '#2F7FC8'} />
        <rect x="4" y="21" width="24" height="17" rx="1.5" fill={night ? '#23344D' : '#FFFFFF'} />
        <rect x="12" y="26" width="8" height="7" rx="1" fill={night ? '#FFD57A' : '#9FC3D8'} />
      </g>
      <path d="M0 142 C 60 120, 130 134, 200 126 S 330 112, 400 132 V170 H0Z" fill={c.front} />
      {[40, 70, 352].map((x, i) => (
        <g key={x} transform={`translate(${x} ${128 - i * 3})`}>
          <rect x="-1.5" y="0" width="3" height="12" fill={night ? '#20190F' : '#7A5A3C'} />
          <circle cx="0" cy="-2" r={9 - i} fill={night ? '#1A2536' : '#5E9A55'} />
        </g>
      ))}
    </svg>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF">
      <ellipse cx="0" cy="8" rx="30" ry="11" />
      <circle cx="-10" cy="2" r="12" />
      <circle cx="9" cy="-2" r="15" />
    </g>
  );
}

// ── the streak tree ──

const FLOWER_COLORS = ['#E8766B', '#F2A65A', '#F4CC55', '#C79BDB', '#F28FB0', '#7FB6E0'];
// Petals in the app's sky-blue and white, with a little pink and gold.
const PETAL_COLORS = ['#9CCBFF', '#FFFFFF', '#BFE0FF', '#5FA8EE', '#F7C6D9', '#FFE08A'];
const TREE_SLOTS = 21;

/** A tree with one flower per day in a row; `fresh` makes today's flower bloom in. */
export function MemoryTree({ count, fresh = false, size = 220 }: { count: number; fresh?: boolean; size?: number }) {
  const slots = useMemo(() => {
    const r = rng(42);
    const pts: { x: number; y: number; d: number }[] = [];
    while (pts.length < TREE_SLOTS) {
      const a = r() * Math.PI * 2, k = Math.sqrt(r());
      const x = 120 + Math.cos(a) * 84 * k, y = 84 + Math.sin(a) * 56 * k;
      if (pts.every(p => (p.x - x) ** 2 + (p.y - y) ** 2 > 260)) pts.push({ x, y, d: (x - 120) ** 2 + (y - 84) ** 2 * 2 });
    }
    return pts.sort((a, b) => a.d - b.d);
  }, []);
  const shown = Math.min(count, TREE_SLOTS);
  const buds = Math.min(TREE_SLOTS, Math.max(shown + 3, 6));

  return (
    <svg className="mb-tree" width={size} height={size * 0.92} viewBox="0 0 240 220" aria-hidden>
      <ellipse cx="120" cy="206" rx="70" ry="9" fill="rgba(90,60,30,.14)" />
      <g stroke="#8A5E3B" strokeLinecap="round" fill="none">
        <path d="M120 206 C 117 176, 123 150, 118 124 C 114 100, 104 86, 90 70" strokeWidth="11" />
        <path d="M119 146 C 136 128, 152 116, 170 100" strokeWidth="7" />
        <path d="M118 124 C 126 104, 138 86, 150 62" strokeWidth="6" />
        <path d="M117 166 C 100 156, 86 146, 70 132" strokeWidth="6" />
      </g>
      <g fill="#7DB36F">
        <ellipse cx="120" cy="84" rx="92" ry="62" opacity=".35" />
        <ellipse cx="86" cy="96" rx="44" ry="34" opacity=".35" />
        <ellipse cx="156" cy="78" rx="46" ry="36" opacity=".35" />
      </g>
      {slots.slice(0, buds).map((p, i) =>
        i < shown ? (
          <g key={i} transform={`translate(${p.x} ${p.y})`}>
            <g className={fresh && i === shown - 1 ? 'mb-bloom' : undefined}>
              {[0, 72, 144, 216, 288].map(a => (
                <ellipse key={a} cx="0" cy="-6" rx="4.6" ry="6.4" transform={`rotate(${a})`} fill={FLOWER_COLORS[i % FLOWER_COLORS.length]} />
              ))}
              <circle r="3.4" fill="#FFF3C4" />
            </g>
          </g>
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r="3.2" fill="#5E9A55" />
        ),
      )}
    </svg>
  );
}

// ── falling petals (celebrations) ──

export function Petals({ count = 16, seed = 3 }: { count?: number; seed?: number }) {
  const petals = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      x: r() * 100, delay: -r() * 9, dur: 7 + r() * 6, rot: r() * 360, s: 0.7 + r() * 0.8,
      color: PETAL_COLORS[Math.floor(r() * PETAL_COLORS.length)],
    }));
  }, [count, seed]);
  return (
    <div className="mb-petals" aria-hidden>
      {petals.map((p, i) => (
        <span key={i} style={{ left: p.x + '%', animationDelay: p.delay + 's', animationDuration: p.dur + 's', '--r': p.rot + 'deg', '--s': p.s } as CSSProperties}>
          <svg width="18" height="14" viewBox="0 0 18 14"><path d="M1 7 C 5 0, 13 0, 17 7 C 13 14, 5 14, 1 7Z" fill={p.color} stroke="rgba(31,111,184,.25)" strokeWidth=".8" /></svg>
        </span>
      ))}
    </div>
  );
}

// ── illustrations ──

/** Welcome: an open album with two photos and a heart. */
export function AlbumArt() {
  return (
    <svg className="mb-art" viewBox="0 0 320 190" aria-hidden>
      <ellipse cx="160" cy="176" rx="130" ry="10" fill="rgba(20,60,110,.12)" />
      <path d="M160 40 C 120 26, 60 26, 22 38 V 170 C 60 158, 120 158, 160 172 Z" fill="#F7FBFF" stroke="#D3E3F2" strokeWidth="2" />
      <path d="M160 40 C 200 26, 260 26, 298 38 V 170 C 260 158, 200 158, 160 172 Z" fill="#FFFFFF" stroke="#D3E3F2" strokeWidth="2" />
      <path d="M160 40 V172" stroke="#C9DCEE" strokeWidth="2" />
      <rect x="236" y="20" width="14" height="40" rx="2" fill="#2F7FC8" />
      <g transform="translate(46 58) rotate(-7)">
        <rect width="86" height="94" rx="3" fill="#fff" stroke="#DCE7F2" />
        <rect x="7" y="7" width="72" height="62" rx="2" fill="#BFE0F2" />
        <circle cx="58" cy="26" r="9" fill="#FFC84A" />
        <path d="M7 58 C 25 44, 45 54, 60 46 S 79 50, 79 50 V69 H7Z" fill="#8DB880" />
      </g>
      <g transform="translate(184 52) rotate(6)">
        <rect width="86" height="94" rx="3" fill="#fff" stroke="#DCE7F2" />
        <rect x="7" y="7" width="72" height="62" rx="2" fill="#DCEEFF" />
        <circle cx="43" cy="30" r="11" fill="#8A5E3B" />
        <path d="M22 69 C 24 48, 62 48, 64 69Z" fill="#2F7FC8" />
      </g>
      <g className="mb-float">
        <path transform="translate(150 12)" d="M10 18 C 2 12, 0 7, 3 3 C 6 0, 9 1, 10 4 C 11 1, 14 0, 17 3 C 20 7, 18 12, 10 18Z" fill="#E8766B" />
      </g>
      <g fill="#F4CC55">
        <path d="M290 96 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <path d="M30 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>
    </svg>
  );
}

/** Shoot / empty book: a camera printing a photo. */
export function CameraArt() {
  return (
    <svg className="mb-art" viewBox="0 0 260 190" aria-hidden>
      <ellipse cx="130" cy="178" rx="96" ry="9" fill="rgba(20,60,110,.12)" />
      <g className="mb-float" style={{ animationDelay: '-1s' }}>
        <g transform="translate(92 102) rotate(-5)">
          <rect width="76" height="70" rx="3" fill="#fff" stroke="#DCE7F2" />
          <rect x="6" y="6" width="64" height="46" rx="2" fill="#DCEEFF" />
          <circle cx="24" cy="24" r="7" fill="#F2A65A" />
          <path d="M6 44 C 22 32, 40 42, 70 34 V52 H6Z" fill="#8DB880" />
        </g>
      </g>
      <rect x="48" y="30" width="164" height="96" rx="20" fill="#2F7FC8" />
      <rect x="48" y="30" width="164" height="30" rx="20" fill="#4A97DA" />
      <rect x="72" y="18" width="40" height="18" rx="6" fill="#1C69B0" />
      <circle cx="130" cy="80" r="34" fill="#EEF6FF" />
      <circle cx="130" cy="80" r="25" fill="#17263A" />
      <circle cx="130" cy="80" r="14" fill="#5B6B8C" />
      <circle cx="123" cy="73" r="5" fill="#fff" opacity=".8" />
      <rect x="180" y="42" width="18" height="10" rx="3" fill="#FFE7A8" />
      <g fill="#F4CC55">
        <path d="M226 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
        <path d="M30 70 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
      </g>
    </svg>
  );
}

// ── voice ──

/** A voice-shaped bar strip for a saved story; bars fill in as it plays. */
export function Waveform({ seed, pct, bars = 38 }: { seed: string; pct: number; bars?: number }) {
  const heights = useMemo(() => {
    const r = rng(seed);
    let prev = 0.5;
    return Array.from({ length: bars }, () => (prev = Math.min(1, Math.max(0.18, prev * 0.45 + r() * 0.75))));
  }, [seed, bars]);
  return (
    <div className="mb-wave" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      {heights.map((h, i) => <i key={i} className={(i + 0.5) / bars * 100 <= pct ? 'on' : undefined} style={{ height: h * 100 + '%' }} />)}
    </div>
  );
}

/** Live bars that move with the microphone while the elder is telling a story. */
export function LiveWave({ level }: { level: () => number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext('2d')!;
    const color = getComputedStyle(cv).color;
    const hist: number[] = Array(44).fill(0.04);
    let smooth = 0, raf = 0, frame = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      smooth = smooth * 0.6 + level() * 0.4;
      if (++frame % 3 === 0) { hist.push(Math.max(0.04, smooth)); hist.shift(); }
      g.clearRect(0, 0, w, h);
      g.fillStyle = color;
      const step = w / hist.length, bw = step * 0.55;
      hist.forEach((v, i) => {
        const bh = Math.max(4, v * h * 0.95);
        g.globalAlpha = 0.35 + 0.65 * (i / hist.length);
        g.beginPath();
        g.roundRect(i * step + (step - bw) / 2, (h - bh) / 2, bw, bh, bw / 2);
        g.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [level]);
  return <canvas ref={ref} className="mb-livewave" aria-hidden />;
}

export function Spinner() {
  return (
    <svg className="mb-spinner" width="56" height="56" viewBox="0 0 50 50" aria-hidden>
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeOpacity=".18" strokeWidth="5" />
      <path d="M25 5 A20 20 0 0 1 45 25" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
