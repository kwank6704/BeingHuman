'use client';

import { useEffect, useRef, useState } from 'react';
import { canListen, listen } from '@/lib/listen';
import { fmt } from '@/lib/media';
import { stopSpeaking } from '@/lib/speech';
import { useBook } from '../book';
import { MAX_REC_SEC } from '../useRecorder';
import { RELS, SAY, memTitle } from '../useBookState';
import { CameraArt, Icon, LiveWave, Petals, Waveform, type IconName } from '../art';
import { Btn, FileBtn, H1, Photo, Polaroid, Say, Sub, px, type Kind } from '../ui';

export function Shoot() {
  const b = useBook();
  return (
    <div className="mb-screen mb-pad">
      <Say text={SAY.shoot} className="mb-grow mb-center" style={{ gap: 10 }}>
        <CameraArt />
        <H1 fs={42}>ถ่ายรูปใหม่</H1>
        <Sub fs={24}>{SAY.shoot}</Sub>
      </Say>
      <FileBtn kind="primary" h={130} fs={33} icon="camera" capture onPick={b.onPick}>เปิดกล้อง</FileBtn>
      <FileBtn kind="secondary" h={96} fs={28} icon="image" onPick={b.onPick}>เลือกรูปที่มีในเครื่อง</FileBtn>
    </div>
  );
}

/** The photo being added, or the saved photo being changed. */
function usePhotoUrl() {
  const b = useBook();
  return b.editing?.imageUrl ?? b.draft?.url;
}

export function Who() {
  const b = useBook();
  const current = b.editing?.relation ?? b.draft?.relation;
  return (
    <div className="mb-screen">
      <Photo url={usePhotoUrl()} h={220}>
        {!b.editId && (
          <button type="button" className="mb-rotate" onClick={b.rotateDraft}><Icon name="rotate" /> หมุนรูป</button>
        )}
      </Photo>
      <Say text={SAY.who} style={{ padding: '18px 20px 14px' }}>
        <H1 fs={40}>ใครอยู่ในรูปนี้คะ</H1>
      </Say>
      <div className="mb-rels">
        {RELS.map(r => (
          <Btn key={r} kind={r === current ? 'primary' : 'secondary'} pressed={r === current} h={80} fs={30} icon={r === current ? 'check' : undefined} onClick={() => b.pickRel(r)}>{r}</Btn>
        ))}
      </div>
    </div>
  );
}

export function Name() {
  const b = useBook();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<'ok' | 'none' | 'error'>('ok');
  const [mic] = useState(canListen);
  const stopRef = useRef<(() => void) | null>(null);
  const text = b.nameText.trim();

  useEffect(() => () => stopRef.current?.(), []);

  const onMic = async () => {
    if (listening) return stopRef.current?.();
    stopSpeaking();
    setHeard('ok');
    setListening(true);
    const l = listen(b.setNameText);
    stopRef.current = l.stop;
    try {
      const t = await l.done;
      setHeard(t ? 'ok' : 'none');
      if (t) b.say('ได้ยินว่า ' + t + ' ถ้าถูกแล้ว กดใช้ชื่อนี้ได้เลยค่ะ');
    } catch {
      setHeard('error');
    } finally {
      stopRef.current = null;
      setListening(false);
    }
  };

  const hint = listening ? 'กำลังฟัง… พูดได้เลยค่ะ'
    : heard === 'none' ? 'ยังไม่ได้ยินเลย ลองกดแล้วพูดอีกครั้งนะคะ'
    : heard === 'error' ? 'เครื่องนี้ฟังเสียงไม่ได้ พิมพ์แทนได้ค่ะ'
    : 'เช่น ชื่อคนในรูป หรือเป็นงานอะไร';

  const btns: { key: string; label: string; kind: Kind; h: number; fs: number; icon?: IconName; on: () => void }[] = [];
  if (text && !listening) btns.push({ key: 'ok', label: b.editId ? 'เก็บชื่อนี้' : 'ใช้ชื่อนี้ ไปต่อ', icon: 'check', kind: 'primary', h: 112, fs: 31, on: () => b.confirmName(b.nameText) });
  if (mic) btns.push({ key: 'mic', label: listening ? 'พูดเสร็จแล้ว' : text ? 'พูดใหม่' : 'กดแล้วพูดชื่อ', icon: listening ? 'stop' : 'mic', kind: text && !listening ? 'secondary' : 'primary', h: text && !listening ? 84 : 124, fs: text && !listening ? 26 : 32, on: onMic });
  if (!text && !listening) {
    const label = b.editId ? (b.editing?.caption ? 'เอาชื่อออก' : 'ไม่ใส่ชื่อ') : 'ไม่ใส่ชื่อ ข้ามไป';
    btns.push({ key: 'skip', label, kind: mic ? 'ghost' : 'primary', h: mic ? 64 : 112, fs: mic ? 23 : 31, on: () => b.confirmName('') });
  }

  return (
    <div className="mb-screen">
      <Photo url={usePhotoUrl()} h={190} />
      <Say text={SAY.name} className="mb-grow" style={{ gap: 8, padding: '16px 20px' }}>
        <H1 fs={38}>รูปนี้ชื่ออะไรดีคะ</H1>
        <Sub fs={22} style={{ color: listening ? 'var(--color-accent-800)' : undefined }}>{hint}</Sub>
      </Say>
      <div className="mb-actions">
        <input
          className="input mb-input"
          value={b.nameText}
          onChange={e => b.setNameText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && text) b.confirmName(b.nameText); }}
          placeholder="เช่น ฟ้า หลานสาว"
          maxLength={80}
          enterKeyHint="done"
          aria-label="ชื่อรูป"
          style={{ fontSize: px(28) }}
        />
        {btns.map(x => <Btn key={x.key} kind={x.kind} h={x.h} fs={x.fs} icon={x.icon} onClick={x.on}>{x.label}</Btn>)}
      </div>
    </div>
  );
}

export function Tell() {
  const b = useBook();
  const r = b.recorder;
  const { playing, prog } = b.audio;
  const label = b.editing ? memTitle(b.editing) : [b.draft?.relation && 'รูป' + b.draft.relation, b.draft?.caption].filter(Boolean).join(' · ');

  type TellBtn = { label: string; kind: Kind; h: number; fs: number; icon?: IconName; on: () => void };
  let title: string, hint: string, btns: TellBtn[];
  if (r.state === 'on') {
    title = 'กำลังฟังอยู่ค่ะ · ' + fmt(r.sec);
    hint = r.sec >= MAX_REC_SEC - 20 ? 'ใกล้ครบ 3 นาทีแล้วค่ะ' : 'พูดได้เลย เล่าจบแล้วกดปุ่มข้างล่าง';
    btns = [{ label: 'เล่าจบแล้ว', icon: 'stop', kind: 'primary', h: 130, fs: 34, on: r.stop }];
  } else if (r.state === 'done' && r.voice) {
    const v = r.voice;
    title = 'เล่าไว้แล้ว ' + fmt(r.sec);
    hint = 'ถ้าพอใจแล้ว กดเก็บได้เลยค่ะ';
    btns = [
      { label: b.editId ? 'เก็บเรื่องนี้' : 'เก็บรูปนี้', icon: 'check', kind: 'primary', h: 112, fs: 33, on: b.save },
      { label: playing ? 'หยุดฟัง' : 'ฟังที่เล่าไว้', icon: playing ? 'pause' : 'play', kind: 'secondary', h: 84, fs: 27, on: () => b.audio.toggle(v.url, r.sec) },
      { label: 'เล่าใหม่', icon: 'undo', kind: 'ghost', h: 58, fs: 23, on: () => { b.audio.stop(); r.start(); } },
    ];
  } else if (r.micErr) {
    title = 'เครื่องนี้อัดเสียงไม่ได้';
    hint = b.editId ? 'ลองอนุญาตให้ใช้ไมค์ แล้วกดอีกครั้งนะคะ' : 'ไม่เป็นไรค่ะ กดเก็บรูปได้เลย';
    btns = b.editId
      ? [{ label: 'ลองอีกครั้ง', icon: 'mic', kind: 'primary', h: 120, fs: 32, on: r.start }]
      : [{ label: 'เก็บรูปนี้', icon: 'check', kind: 'primary', h: 124, fs: 33, on: b.save }];
  } else {
    title = 'เล่าเรื่องรูปนี้ให้ฟังหน่อยค่ะ';
    hint = 'ถ่ายที่ไหน ตอนไหน ใครอยู่ด้วย';
    btns = [{ label: 'กดแล้วเริ่มเล่า', icon: 'mic', kind: 'primary', h: 124, fs: 33, on: r.start }];
    if (!b.editId) btns.push({ label: 'ไม่เล่า เก็บรูปเลย', kind: 'secondary', h: 88, fs: 27, on: b.save });
  }
  if (b.saveErr && r.state !== 'on') {
    title = 'เก็บไม่สำเร็จ';
    hint = 'ลองกดเก็บอีกครั้งนะคะ';
  }

  return (
    <div className="mb-screen">
      <Photo url={usePhotoUrl()} h={r.state === 'on' ? 170 : 220} />
      <Say text={title + ' ' + hint} className="mb-grow" style={{ gap: 6, padding: '14px 22px' }}>
        {label && <div className="mb-kicker">{label}</div>}
        <H1 fs={36} style={{ lineHeight: 1.22, color: r.state === 'on' ? 'var(--color-accent-700)' : undefined }}>
          {r.state === 'on' && <span className="mb-rec-dot" aria-hidden />}{title}
        </H1>
        <Sub fs={23}>{hint}</Sub>
      </Say>
      <div className="mb-actions">
        {r.state === 'on' && (
          <div className="mb-card mb-recording">
            <span className="mb-mic-pulse" aria-hidden><Icon name="mic" size="34px" /></span>
            <LiveWave level={r.level} />
          </div>
        )}
        {r.state === 'done' && r.voice && <Waveform seed={r.voice.url} pct={prog} />}
        {btns.map(x => <Btn key={x.label} kind={x.kind} h={x.h} fs={x.fs} icon={x.icon} onClick={x.on}>{x.label}</Btn>)}
      </div>
    </div>
  );
}

export function Saved() {
  const b = useBook();
  const m = b.lastSaved;
  return (
    <div className="mb-screen mb-pad">
      <Petals seed={11} count={12} />
      <Say text={'เก็บไว้แล้วค่ะ ตอนนี้มีรูปเก็บไว้ ' + b.mems.length + ' รูป'} className="mb-grow mb-center" style={{ gap: 12 }}>
        <Polaroid url={m?.imageUrl} width={190} rotate={-4} label={m ? memTitle(m) : undefined} style={{ marginBottom: 10 }} />
        <H1 fs={44}>เก็บไว้แล้วค่ะ</H1>
        <Sub fs={24}>ตอนนี้มีรูปเก็บไว้ {b.mems.length} รูป</Sub>
      </Say>
      <Btn kind="primary" h={112} fs={32} icon="camera" onClick={b.startAdd}>เพิ่มอีกรูป</Btn>
      <Btn kind="secondary" h={92} fs={28} icon="home" onClick={() => b.go('home', b.homeSay())}>กลับหน้าแรก</Btn>
      {m && <Btn kind="ghost" h={58} fs={23} icon="image" onClick={() => b.go('view', null)}>ดูรูปที่เพิ่งเก็บ</Btn>}
    </div>
  );
}
