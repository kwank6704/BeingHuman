'use client';

import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { bg } from '@/lib/media';
import { useBook } from './book';

/** Font size that follows the elder's text-size setting (--k). */
export const px = (n: number) => `calc(${n}px * var(--k))`;
/** Control height: grows half as fast as the text, so big text still fits on screen. */
const hpx = (n: number) => `calc(${n}px * var(--kh))`;

export type Kind = 'primary' | 'secondary' | 'ghost';

type BtnProps = { kind: Kind; h: number; fs: number; gap?: number; pressed?: boolean; onClick?: () => void; children: ReactNode; style?: CSSProperties };

export function Btn({ kind, h, fs, gap, pressed, onClick, children, style }: BtnProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={`btn btn-${kind} mb-btn`} style={{ minHeight: hpx(h), fontSize: px(fs), gap, ...style }}>
      {children}
    </button>
  );
}

export function FileBtn({ kind, h, fs, gap, capture, onPick, children }: { kind: Kind; h: number; fs: number; gap: number; capture?: boolean; onPick: (e: ChangeEvent<HTMLInputElement>) => void; children: ReactNode }) {
  return (
    <label className={`btn btn-${kind} mb-btn`} style={{ minHeight: hpx(h), fontSize: px(fs), gap }}>
      {children}
      <input type="file" accept="image/*" capture={capture ? 'environment' : undefined} onChange={onPick} />
    </label>
  );
}

/** A heading block the elder can tap to hear it again. */
export function Say({ text, className = '', style, children }: { text: string | undefined; className?: string; style?: CSSProperties; children: ReactNode }) {
  const { say } = useBook();
  return (
    <button type="button" onClick={() => say(text, true)} className={`mb-say ${className}`} style={style} aria-label={text ? 'ฟังอีกครั้ง: ' + text : undefined}>
      {children}
    </button>
  );
}

export function H1({ fs, children, style }: { fs: number; children: ReactNode; style?: CSSProperties }) {
  return <div className="mb-h1" style={{ fontSize: px(fs), ...style }}>{children}</div>;
}

export function Sub({ fs, children, style }: { fs: number; children: ReactNode; style?: CSSProperties }) {
  return <div className="mb-sub" style={{ fontSize: px(fs), ...style }}>{children}</div>;
}

/** A photo that opens full screen when tapped. `children` are overlays (e.g. arrows). */
export function Photo({ url, h, zoomable = true, children }: { url: string | null | undefined; h: number; zoomable?: boolean; children?: ReactNode }) {
  const { setZoom } = useBook();
  return (
    <div className="mb-photo" style={{ height: h, ...bg(url) }}>
      {zoomable && url && (
        <button type="button" className="mb-photo-tap" onClick={() => setZoom(url)} aria-label="ดูรูปให้ใหญ่เต็มจอ">
          <span className="mb-chip">⤢ ดูรูปใหญ่</span>
        </button>
      )}
      {children}
    </div>
  );
}

export function Progress({ pct }: { pct: number }) {
  return <div className="mb-progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: pct + '%' }} /></div>;
}

export function PlayIcon({ playing }: { playing: boolean }) {
  return <span className="mb-play-icon" aria-hidden>{playing ? '❚❚' : '▶'}</span>;
}
