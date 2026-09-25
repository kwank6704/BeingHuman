'use client';

import { useCallback, useEffect, useState } from 'react';
import { bg, thDate } from '@/lib/media';
import { stopSpeaking } from '@/lib/speech';
import { useBook } from '../book';
import { RELS, SAY, albumName, albumOf, memSay, memTitle, type Album } from '../useBookState';
import { Btn, H1, Photo, PlayIcon, Progress, Say, Sub, px } from '../ui';

export function Albums() {
  const b = useBook();
  const groups: Album[] = [
    ...(b.mems.some(m => m.favorite) ? ['fav'] : []),
    ...RELS.filter(r => b.mems.some(m => m.relation === r)),
    'all',
  ];
  return (
    <div className="mb-screen">
      <Say text={SAY.albums} style={{ padding: '20px 20px 14px' }}>
        <H1 fs={38}>อยากดูรูปของใครคะ</H1>
      </Say>
      <div className="mb-actions" style={{ paddingBottom: 14 }}>
        <Btn kind="primary" h={96} fs={28} onClick={() => b.startSlideshow('all')}>▶  เปิดดูทุกรูปเอง</Btn>
      </div>
      <div className="mb-list">
        {groups.map(g => {
          const items = albumOf(b.mems, g);
          return (
            <button key={g} type="button" className="mb-row" onClick={() => b.openAlbum(g)}>
              <span className="mb-row-thumb" style={bg(items[0]?.imageUrl)} />
              <span className="mb-row-text">
                <span className="mb-row-title" style={{ fontSize: px(30) }}>{g === 'fav' && <span className="mb-heart" aria-hidden>❤ </span>}{albumName(g)}</span>
                <span className="mb-row-sub" style={{ fontSize: px(19) }}>{items.length} รูป</span>
              </span>
              <span className="mb-row-go" aria-hidden>›</span>
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
        <Btn kind="primary" h={112} fs={31} onClick={() => b.go('albums')}>เลือกกลุ่มรูปอื่น</Btn>
      </div>
    );
  }
  const i = b.list.indexOf(m);
  const many = b.list.length > 1;
  const { playing, prog } = b.audio;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={300}>
        {many && (
          <>
            <button type="button" className="mb-arrow l" onClick={() => b.step(-1)} aria-label="รูปก่อนหน้า">‹</button>
            <button type="button" className="mb-arrow r" onClick={() => b.step(1)} aria-label="รูปต่อไป">›</button>
          </>
        )}
      </Photo>
      <Say text={memSay(m)} className="mb-grow" style={{ gap: 6, padding: '14px 20px' }}>
        <div className="mb-kicker">{albumName(b.album)} · รูปที่ {i + 1} จาก {b.list.length}</div>
        <H1 fs={44} style={{ lineHeight: 1.15 }}>
          {memTitle(m)}{m.favorite && <span className="mb-heart" aria-label="รูปโปรด"> ❤</span>}
        </H1>
        <Sub fs={22}>{m.caption ? 'รูป' + m.relation + ' · ' : ''}เก็บไว้เมื่อ {thDate(m.createdAt)}</Sub>
      </Say>
      <div className="mb-actions">
        {m.voiceUrl ? (
          <>
            <Btn kind="primary" h={104} fs={29} gap={16} onClick={() => b.audio.toggle(m.voiceUrl!, m.voiceDurationSec)}>
              <PlayIcon playing={playing} />{playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้'}
            </Btn>
            <Progress pct={prog} />
          </>
        ) : (
          <Btn kind="primary" h={104} fs={29} onClick={b.editStory}>●  เล่าเรื่องรูปนี้</Btn>
        )}
        <div className={many ? 'mb-grid2' : 'mb-stack'}>
          <Btn kind="secondary" h={84} fs={25} pressed={m.favorite} onClick={() => b.toggleFav(m)}>
            <span className={m.favorite ? 'mb-heart' : undefined} aria-hidden>{m.favorite ? '❤' : '♡'}</span> รูปโปรด
          </Btn>
          {many && <Btn kind="secondary" h={84} fs={27} onClick={() => b.step(1)}>รูปต่อไป ›</Btn>}
        </div>
        <Btn kind="ghost" h={56} fs={22} onClick={() => b.go('more')}>เปลี่ยนชื่อ · ลบ · อื่นๆ ⋯</Btn>
      </div>
    </div>
  );
}

export function More() {
  const b = useBook();
  const m = b.cur;
  if (!m) return null;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={200} zoomable={false} />
      <Say text={SAY.more + ' ' + memTitle(m)} className="mb-grow" style={{ gap: 4, padding: '16px 20px' }}>
        <div className="mb-kicker">{memTitle(m)}</div>
        <H1 fs={36}>ทำอะไรกับรูปนี้ดีคะ</H1>
      </Say>
      <div className="mb-actions">
        <Btn kind="secondary" h={80} fs={26} onClick={b.editName}>✎  {m.caption ? 'เปลี่ยนชื่อรูป' : 'ใส่ชื่อรูป'}</Btn>
        <Btn kind="secondary" h={80} fs={26} onClick={b.editWho}>☺  เปลี่ยนว่าใครอยู่ในรูป</Btn>
        {m.voiceUrl && <Btn kind="secondary" h={80} fs={26} onClick={b.editStory}>●  เล่าเรื่องใหม่</Btn>}
        {b.shareOk && <Btn kind="secondary" h={80} fs={26} onClick={() => b.share(m)}>↗  ส่งรูปนี้ให้ลูกหลาน</Btn>}
        <Btn kind="ghost" h={64} fs={24} onClick={() => b.go('confirmDelete')}>ลบรูปนี้</Btn>
      </div>
    </div>
  );
}

export function ConfirmDelete() {
  const b = useBook();
  const m = b.cur;
  if (!m) return null;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={240} zoomable={false} />
      <div className="mb-screen" style={{ gap: 12, padding: 20 }}>
        <Say text={SAY.confirmDelete} className="mb-grow" style={{ gap: 8 }}>
          <H1 fs={40}>ลบรูปนี้ใช่ไหมคะ</H1>
          <Sub fs={22}>ถ้าลบผิด กดเอาคืนได้ค่ะ</Sub>
        </Say>
        <Btn kind="primary" h={112} fs={31} onClick={() => b.go('view', null)}>ไม่ลบ เก็บไว้</Btn>
        <Btn kind="secondary" h={92} fs={27} onClick={b.del}>ลบเลย</Btn>
      </div>
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
      <button type="button" className="mb-slide-photo" style={bg(m.imageUrl)} onClick={next} aria-label="รูปต่อไป" />
      <div className="mb-slide-cap">
        <div className="mb-h1" style={{ fontSize: px(40), lineHeight: 1.15 }}>{memTitle(m)}</div>
        <div className="mb-sub" style={{ fontSize: px(21) }}>
          {m.caption ? 'รูป' + m.relation + ' · ' : ''}{thDate(m.createdAt)} · {(i % list.length) + 1}/{list.length}
        </div>
        {m.voiceUrl && <Progress pct={b.audio.prog} />}
      </div>
      <div className="mb-actions">
        <Btn kind="primary" h={96} fs={30} onClick={() => b.go('albums', null)}>■  หยุดดู</Btn>
      </div>
    </div>
  );
}
