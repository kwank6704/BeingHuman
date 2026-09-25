'use client';

import { thDate } from '@/lib/media';
import { useBook } from '../book';
import { SAY, memSay, memTitle } from '../useBookState';
import { Btn, H1, Photo, PlayIcon, Progress, Say, Sub } from '../ui';

export function Today() {
  const b = useBook();
  const m = b.daily[b.ti];
  if (!m) return null;
  const { playing, prog } = b.audio;
  const last = b.ti + 1 >= b.daily.length;
  return (
    <div className="mb-screen">
      <Photo url={m.imageUrl} h={300} />
      <Say text={memSay(m)} className="mb-grow" style={{ gap: 6, padding: '16px 20px' }}>
        <div className="mb-kicker">รูปวันนี้ · รูปที่ {b.ti + 1} จาก {b.daily.length}</div>
        <H1 fs={46} style={{ lineHeight: 1.15 }}>{memTitle(m)}</H1>
        <Sub fs={22}>{m.caption ? 'รูป' + m.relation + ' · ' : ''}เก็บไว้เมื่อ {thDate(m.createdAt)}</Sub>
      </Say>
      <div className="mb-dots" aria-hidden>
        {b.daily.map((x, k) => <i key={x.id} className={k <= b.ti ? 'on' : ''} />)}
      </div>
      <div className="mb-actions">
        {m.voiceUrl && (
          <>
            <Btn kind="primary" h={108} fs={30} gap={16} onClick={() => b.audio.toggle(m.voiceUrl!, m.voiceDurationSec)}>
              <PlayIcon playing={playing} />{playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้อีกครั้ง'}
            </Btn>
            <Progress pct={prog} />
          </>
        )}
        <Btn kind={m.voiceUrl ? 'secondary' : 'primary'} h={m.voiceUrl ? 96 : 124} fs={30} onClick={() => b.goToday(b.ti + 1)}>
          {last ? 'ดูครบแล้ว ›' : 'รูปต่อไป ›'}
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
      <Say text={SAY.todayDone + (s > 1 ? ' ดูรูปมาแล้ว ' + s + ' วันติดกัน เก่งมากค่ะ' : '')} className="mb-grow" style={{ gap: 14 }}>
        <div className="mb-badge" aria-hidden>✿</div>
        <H1 fs={46}>วันนี้ดูครบแล้วค่ะ</H1>
        <Sub fs={26}>พรุ่งนี้จะมีรูปชุดใหม่ให้ดูค่ะ</Sub>
        {s > 0 && <div className="mb-streak">ดูรูปมาแล้ว {s} วันติดกัน</div>}
      </Say>
      <Btn kind="primary" h={118} fs={32} onClick={b.startAdd}>+ เพิ่มรูปใหม่</Btn>
      <Btn kind="secondary" h={96} fs={28} onClick={() => b.go('home', b.homeSay())}>กลับหน้าแรก</Btn>
      <Btn kind="ghost" h={60} fs={23} onClick={() => b.go('albums')}>ดูรูปทั้งหมด ›</Btn>
    </div>
  );
}
