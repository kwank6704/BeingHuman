'use client';

import { thDate } from '@/lib/media';
import { Icon, MemoryTree, Petals, Waveform } from '../art';
import { useBook } from '../book';
import { SAY, memSay, memTitle } from '../useBookState';
import { Btn, H1, Photo, PlayIcon, Say, Sub } from '../ui';

export function Today() {
  const b = useBook();
  const m = b.daily[b.ti];
  if (!m) return null;
  const { playing, prog } = b.audio;
  const last = b.ti + 1 >= b.daily.length;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={320} />
      <div className="mb-dots" aria-hidden>
        {b.daily.map((x, k) => <i key={x.id} className={k < b.ti ? 'done' : k === b.ti ? 'on' : ''} />)}
      </div>
      <Say text={memSay(m)} className="mb-grow" style={{ gap: 4, padding: '6px 22px 14px' }}>
        <div className="mb-kicker">รูปวันนี้ · รูปที่ {b.ti + 1} จาก {b.daily.length}</div>
        <H1 fs={44} style={{ lineHeight: 1.15 }}>{memTitle(m)}</H1>
        <Sub fs={22}>{m.caption ? 'รูป' + m.relation + ' · ' : ''}เก็บไว้เมื่อ {thDate(m.createdAt)}</Sub>
      </Say>
      <div className="mb-actions">
        {m.voiceUrl && (
          <div className="mb-card mb-player">
            <Btn kind="primary" h={100} fs={29} gap={14} lead={<PlayIcon playing={playing} />} onClick={() => b.audio.toggle(m.voiceUrl!, m.voiceDurationSec)}>
              {playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้'}
            </Btn>
            <Waveform seed={m.id} pct={prog} />
          </div>
        )}
        <Btn kind={m.voiceUrl ? 'secondary' : 'primary'} h={m.voiceUrl ? 90 : 116} fs={30} icon={last ? 'check' : undefined} iconEnd={last ? undefined : 'right'} onClick={() => b.goToday(b.ti + 1)}>
          {last ? 'ดูครบแล้ว' : 'รูปต่อไป'}
        </Btn>
      </div>
    </div>
  );
}

export function TodayDone() {
  const b = useBook();
  const s = b.streak.streak;
  return (
    <div className="mb-screen mb-pad">
      <Petals />
      <Say text={SAY.todayDone + (s > 1 ? ' ดูรูปมาแล้ว ' + s + ' วันติดกัน เก่งมากค่ะ' : '')} className="mb-grow mb-center" style={{ gap: 10 }}>
        <MemoryTree count={Math.max(1, s)} fresh size={230} />
        <H1 fs={44}>วันนี้ดูครบแล้วค่ะ</H1>
        <Sub fs={24}>พรุ่งนี้จะมีรูปชุดใหม่ให้ดูค่ะ</Sub>
        {s > 0 && <div className="mb-streak"><Icon name="flower" /> ดูรูปมาแล้ว {s} วันติดกัน</div>}
      </Say>
      <Btn kind="primary" h={112} fs={31} icon="camera" onClick={b.startAdd}>เพิ่มรูปใหม่</Btn>
      <Btn kind="secondary" h={92} fs={28} icon="home" onClick={() => b.go('home', b.homeSay())}>กลับหน้าแรก</Btn>
      <Btn kind="ghost" h={58} fs={23} icon="album" onClick={() => b.go('albums')}>ดูรูปทั้งหมด</Btn>
    </div>
  );
}
