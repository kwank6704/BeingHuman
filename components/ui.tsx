'use client';

import type { ChangeEvent, CSSProperties, ReactNode } from 'react';
import { bg } from '@/lib/media';
import { Icon, type IconName } from './art';
import { useBook } from './book';

/** Font size that follows the elder's text-size setting (--k). */
export const px = (n: number) => `calc(${n}px * var(--k))`;
/** Control height: grows half as fast as the text, so big text still fits on screen. */
const hpx = (n: number) => `calc(${n}px * var(--kh))`;

export type Kind = 'primary' | 'secondary' | 'ghost';

type BtnProps = {
  kind: Kind; h: number; fs: number; icon?: IconName; iconEnd?: IconName; gap?: number; pressed?: boolean;
  onClick?: () => void; children: ReactNode; style?: CSSProperties;
};

export function Btn({ kind, h, fs, icon, iconEnd, gap, pressed, onClick, children, style }: BtnProps) {
  return (
    <button type="button" onClick={onClick} aria-pressed={pressed} className={`btn btn-${kind} mb-btn`}
      style={{ minHeight: hpx(h), fontSize: px(fs), gap: gap ?? '0.4em', ...style }}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
      {iconEnd && <Icon name={iconEnd} />}
    </button>
  );
}

export function FileBtn({ kind, h, fs, icon, capture, onPick, children }: { kind: Kind; h: number; fs: number; icon?: IconName; capture?: boolean; onPick: (e: ChangeEvent<HTMLInputElement>) => void; children: ReactNode }) {
  return (
    <label className={`btn btn-${kind} mb-btn`} style={{ minHeight: hpx(h), fontSize: px(fs), gap: '0.45em' }}>
      {icon && <Icon name={icon} size="1.3em" />}
      <span>{children}</span>
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

/**
 * A photo in a rounded frame that opens full screen when tapped. The whole picture is always shown
 * (never cropped — faces matter); a soft blurred copy fills the space around it.
 * `children` are overlays (e.g. arrows).
 */
export function Photo({ url, h, zoomable = true, children }: { url: string | null | undefined; h: number; zoomable?: boolean; children?: ReactNode }) {
  const { setZoom } = useBook();
  return (
    <div className="mb-photo-wrap" style={{ height: h }}>
      <div className="mb-photo">
        <div className="mb-photo-blur" style={bg(url)} />
        <div className="mb-photo-img" style={bg(url)} />
        {zoomable && url && (
          <button type="button" className="mb-photo-tap" onClick={() => setZoom(url)} aria-label="ดูรูปให้ใหญ่เต็มจอ">
            <span className="mb-chip"><Icon name="expand" size="0.95em" /> ดูรูปใหญ่</span>
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

/** A printed photo with a white border, slightly turned, as if placed in an album. */
export function Polaroid({ url, width, rotate = 0, label, style }: { url: string | null | undefined; width: number | string; rotate?: number; label?: string; style?: CSSProperties }) {
  return (
    <div className="mb-polaroid" style={{ width, transform: `rotate(${rotate}deg)`, ...style }}>
      {/* padding in % is measured against the parent, so the frame sits inside the sized box */}
      <div className="mb-polaroid-frame">
        <div className="mb-polaroid-img" style={bg(url)} />
        {label && <div className="mb-polaroid-label">{label}</div>}
      </div>
    </div>
  );
}

export function PlayIcon({ playing }: { playing: boolean }) {
  return <span className="mb-play-icon" aria-hidden><Icon name={playing ? 'pause' : 'play'} size="0.9em" /></span>;
}
