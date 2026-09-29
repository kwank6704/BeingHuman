'use client';

import { useCallback, useEffect, useState } from 'react';
import { bg, thDate } from '@/lib/media';
import { stopSpeaking } from '@/lib/speech';
import { Icon, Waveform, type IconName } from '../art';
import { useBook } from '../book';
import { RELS, SAY, albumName, albumOf, memSay, memTitle, type Album } from '../useBookState';
import { Btn, H1, Photo, PlayIcon, Polaroid, Say, Sub, px } from '../ui';

export function Albums() {
  const b = useBook();
  const groups: Album[] = [
    ...(b.mems.some(m => m.favorite) ? ['fav'] : []),
    ...RELS.filter(r => b.mems.some(m => m.relation === r)),
    'all',
  ];
  return (
    <div className="mb-screen mb-pad" style={{ gap: 16 }}>
      <Say text={SAY.albums}><H1 fs={38}>อยากดูรูปของใครคะ</H1></Say>
      <Btn kind="primary" h={96} fs={28} icon="play" onClick={() => b.startSlideshow('all')}>เปิดดูทุกรูปเอง</Btn>
      <div className="mb-albums">
        {groups.map((g, i) => {
          const items = albumOf(b.mems, g);
          return (
            <button key={g} type="button" className="mb-album" onClick={() => b.openAlbum(g)}>
              <span className="mb-album-stack" aria-hidden>
                {items[1] && <Polaroid url={items[1].imageUrl} width="82%" rotate={i % 2 ? 7 : -7} style={{ position: 'absolute', top: 6, left: '9%' }} />}
                <Polaroid url={items[0]?.imageUrl} width="82%" rotate={i % 2 ? -2 : 2} style={{ position: 'relative' }} />
              </span>
              <span className="mb-album-title" style={{ fontSize: px(27) }}>
                {g === 'fav' && <Icon name="heartFill" style={{ color: 'var(--rose)' }} />}{albumName(g)}
              </span>
              <span className="mb-album-sub" style={{ fontSize: px(19) }}>{items.length} รูป</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function View() {
  const b = useBook();
  const m = b.cur;
  if (!m) {
    return (
      <div className="mb-screen mb-pad">
        <Say text="กลุ่มนี้ไม่มีรูปแล้วค่ะ" className="mb-grow"><H1 fs={40}>กลุ่มนี้ไม่มีรูปแล้วค่ะ</H1></Say>
        <Btn kind="primary" h={112} fs={31} icon="album" onClick={() => b.go('albums')}>เลือกกลุ่มรูปอื่น</Btn>
      </div>
    );
  }
  const i = b.list.indexOf(m);
  const many = b.list.length > 1;
  const { playing, prog } = b.audio;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={310}>
        {many && (
          <>
            <button type="button" className="mb-arrow l" onClick={() => b.step(-1)} aria-label="รูปก่อนหน้า"><Icon name="left" size="34px" /></button>
            <button type="button" className="mb-arrow r" onClick={() => b.step(1)} aria-label="รูปต่อไป"><Icon name="right" size="34px" /></button>
          </>
        )}
      </Photo>
      <Say text={memSay(m)} className="mb-grow" style={{ gap: 4, padding: '12px 22px' }}>
        <div className="mb-kicker">{albumName(b.album)} · รูปที่ {i + 1} จาก {b.list.length}</div>
        <H1 fs={42} style={{ lineHeight: 1.15 }}>
          {memTitle(m)}{m.favorite && <span className="mb-heart" aria-label="รูปโปรด"> <Icon name="heartFill" size="0.7em" /></span>}
        </H1>
        <Sub fs={22}>{m.caption ? 'รูป' + m.relation + ' · ' : ''}เก็บไว้เมื่อ {thDate(m.createdAt)}</Sub>
      </Say>
      <div className="mb-actions">
        {m.voiceUrl ? (
          <div className="mb-card mb-player">
            <Btn kind="primary" h={96} fs={28} gap={14} lead={<PlayIcon playing={playing} />} onClick={() => b.audio.toggle(m.voiceUrl!, m.voiceDurationSec)}>
              {playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้'}
            </Btn>
            <Waveform seed={m.id} pct={prog} />
          </div>
        ) : (
          <Btn kind="primary" h={100} fs={29} icon="mic" onClick={b.editStory}>เล่าเรื่องรูปนี้</Btn>
        )}
        <div className={many ? 'mb-grid2' : 'mb-stack'}>
          <Btn kind="secondary" h={82} fs={25} icon={m.favorite ? 'heartFill' : 'heart'} pressed={m.favorite} onClick={() => b.toggleFav(m)}>รูปโปรด</Btn>
          {many && <Btn kind="secondary" h={82} fs={26} iconEnd="right" onClick={() => b.step(1)}>รูปต่อไป</Btn>}
        </div>
        <Btn kind="ghost" h={56} fs={22} icon="more" onClick={() => b.go('more')}>เปลี่ยนชื่อ · ลบ · อื่นๆ</Btn>
      </div>
    </div>
  );
}

function Action({ icon, label, onClick, danger }: { icon: IconName; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" className={`mb-action${danger ? ' danger' : ''}`} onClick={onClick} style={{ fontSize: px(25) }}>
      <span className="mb-action-icon"><Icon name={icon} size="26px" /></span>
      <span>{label}</span>
      <Icon name="right" size="24px" style={{ marginLeft: 'auto', opacity: 0.45 }} />
    </button>
  );
}

export function More() {
  const b = useBook();
  const m = b.cur;
  if (!m) return null;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={190} zoomable={false} />
      <Say text={SAY.more + ' ' + memTitle(m)} style={{ gap: 2, padding: '14px 22px 12px' }}>
        <div className="mb-kicker">{memTitle(m)}</div>
        <H1 fs={34}>ทำอะไรกับรูปนี้ดีคะ</H1>
      </Say>
      <div className="mb-actions" style={{ flex: '1 0 auto', justifyContent: 'flex-end' }}>
        <div className="mb-card mb-action-list">
          <Action icon="pencil" label={m.caption ? 'เปลี่ยนชื่อรูป' : 'ใส่ชื่อรูป'} onClick={b.editName} />
          <Action icon="people" label="เปลี่ยนว่าใครอยู่ในรูป" onClick={b.editWho} />
          {m.voiceUrl && <Action icon="mic" label="เล่าเรื่องใหม่" onClick={b.editStory} />}
          {b.shareOk && <Action icon="send" label="ส่งรูปนี้ให้ลูกหลาน" onClick={() => b.share(m)} />}
        </div>
        <Btn kind="ghost" h={64} fs={24} icon="trash" onClick={() => b.go('confirmDelete')}>ลบรูปนี้</Btn>
      </div>
    </div>
  );
}

export function ConfirmDelete() {
  const b = useBook();
  const m = b.cur;
  if (!m) return null;
  return (
    <div className="mb-screen mb-pad" style={{ gap: 12 }}>
      <Say text={SAY.confirmDelete} className="mb-grow mb-center" style={{ gap: 10 }}>
        <Polaroid url={m.imageUrl} width={170} rotate={3} />
        <H1 fs={40} style={{ marginTop: 12 }}>ลบรูปนี้ใช่ไหมคะ</H1>
        <Sub fs={22}>ถ้าลบผิด กดเอาคืนได้ค่ะ</Sub>
      </Say>
      <Btn kind="primary" h={112} fs={31} icon="heart" onClick={() => b.go('view', null)}>ไม่ลบ เก็บไว้</Btn>
      <Btn kind="secondary" h={88} fs={27} icon="trash" onClick={b.del}>ลบเลย</Btn>
    </div>
  );
}

/** Hands-free: plays each photo's story (or reads its name), then moves on by itself. */
export function Slideshow() {
  const b = useBook();
  const list = b.list;
  const [i, setI] = useState(0);
  const m = list.length ? list[i % list.length] : undefined;
  const next = useCallback(() => setI(n => n + 1), []);

  useEffect(() => {
    if (!m) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const later = (ms: number) => {
      clearTimeout(t);
      t = setTimeout(next, ms);
    };
    if (m.voiceUrl) {
      b.audio.play(m.voiceUrl, m.voiceDurationSec, () => later(2500));
      later((m.voiceDurationSec || 60) * 1000 + 8000); // in case the clip never reports its end
    } else {
      b.say(memSay(m));
      later(9000);
    }
    return () => clearTimeout(t);
    // Only a new slide restarts playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, m?.id]);

  // Keep the screen awake while nobody is touching it.
  useEffect(() => {
    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock?.request('screen').then(l => { lock = l; }, () => {});
    return () => {
      lock?.release().catch(() => {});
      stopSpeaking();
    };
  }, []);

  if (!m) return null;
  return (
    <div className="mb-slides">
      <button type="button" className="mb-slide-stage" onClick={next} aria-label="รูปต่อไป">
        {/* keyed by slide, so each photo fades in and starts its own slow zoom */}
        <span key={i} className="mb-slide" style={{ '--pan': i % 2 ? '-3%' : '3%' } as React.CSSProperties}>
          <span className="mb-slide-blur" style={bg(m.imageUrl)} />
          <span className="mb-slide-img" style={bg(m.imageUrl)} />
        </span>
      </button>
      <div className="mb-slide-cap">
        <div className="mb-h1" style={{ fontSize: px(38), lineHeight: 1.15 }}>{memTitle(m)}</div>
        <div className="mb-sub" style={{ fontSize: px(20), opacity: 0.85 }}>
          {m.caption ? 'รูป' + m.relation + ' · ' : ''}{thDate(m.createdAt)} · {(i % list.length) + 1}/{list.length}
        </div>
        {m.voiceUrl && <Waveform seed={m.id} pct={b.audio.prog} />}
      </div>
      <div className="mb-actions">
        <Btn kind="primary" h={92} fs={30} icon="stop" onClick={() => b.go('albums', null)}>หยุดดู</Btn>
      </div>
    </div>
  );
}
