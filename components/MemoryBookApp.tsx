'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type ReactNode } from 'react';
import * as api from '@/lib/api';
import type { Memory } from '@/lib/api';
import { speak, stopSpeaking } from '@/lib/speech';
import { bg, fmt, shrinkImage, thDate } from '@/lib/media';

const RELS = ['ลูก', 'หลาน', 'คู่ชีวิต', 'พี่น้อง', 'เพื่อน', 'ตัวเอง'];
const MAX_REC_SEC = 180;
const INK = 'var(--color-text)';

type Screen = 'home' | 'shoot' | 'who' | 'tell' | 'saved' | 'today' | 'todayDone' | 'view';

const SAY: Partial<Record<Screen, string>> = {
  shoot: 'ถ่ายรูปคนที่รัก หรือถ่ายรูปเก่าในอัลบั้มก็ได้ค่ะ',
  who: 'ใครอยู่ในรูปนี้คะ',
  tell: 'เล่าให้ฟังหน่อยค่ะ รูปนี้ถ่ายที่ไหน ตอนไหน ใครอยู่ด้วย',
  saved: 'เก็บไว้แล้วค่ะ',
  todayDone: 'วันนี้ดูครบแล้วค่ะ พรุ่งนี้จะมีรูปชุดใหม่ให้ดูค่ะ',
};

const BACK_LABEL: Partial<Record<Screen, string>> = {
  shoot: 'กลับหน้าแรก',
  who: 'ถ่ายรูปใหม่',
  tell: 'เลือกคนใหม่',
  view: 'กลับหน้าแรก',
  today: 'กลับหน้าแรก',
};

const memSay = (m: Memory | undefined) => (m ? 'รูป' + m.relation + ' เก็บไว้เมื่อ ' + thDate(m.createdAt) : '');

type Draft = { blob: Blob; url: string; relation: string | null };
type Voice = { blob: Blob; url: string };
type Kind = 'primary' | 'secondary' | 'ghost';

function Btn({ kind, h, fs, onClick, gap, children }: { kind: Kind; h: number; fs: number; onClick?: () => void; gap?: number; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`btn btn-${kind} mb-btn`} style={{ height: h, fontSize: fs, gap }}>
      {children}
    </button>
  );
}

function FileBtn({ kind, h, fs, gap, capture, onPick, children }: { kind: Kind; h: number; fs: number; gap: number; capture?: boolean; onPick: (e: ChangeEvent<HTMLInputElement>) => void; children: ReactNode }) {
  return (
    <label className={`btn btn-${kind} mb-btn`} style={{ height: h, fontSize: fs, gap }}>
      {children}
      <input type="file" accept="image/*" capture={capture ? 'environment' : undefined} onChange={onPick} />
    </label>
  );
}

export default function MemoryBookApp({ askWho = true, autoSpeak = true }: { askWho?: boolean; autoSpeak?: boolean }) {
  const [scr, setScr] = useState<Screen>('home');
  const [mems, setMems] = useState<Memory[]>([]);
  const [daily, setDaily] = useState<Memory[]>([]);
  const [load, setLoad] = useState<'loading' | 'ok' | 'error'>('loading');
  const [vi, setVi] = useState(0);
  const [ti, setTi] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [rec, setRec] = useState<'idle' | 'on' | 'done'>('idle');
  const [recSec, setRecSec] = useState(0);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [micErr, setMicErr] = useState(false);
  const [saveErr, setSaveErr] = useState(false);
  const [lastSaved, setLastSaved] = useState<Memory | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const scrRef = useRef(scr);
  scrRef.current = scr;

  const say = useCallback((text: string | undefined, force = false) => {
    if (force || autoSpeak) speak(text);
  }, [autoSpeak]);

  const refresh = useCallback(async () => {
    const [all, today] = await Promise.all([api.listMemories(), api.todayMemories()]);
    setMems(all);
    setDaily(today);
    return all;
  }, []);

  const loadAll = useCallback(() => {
    setLoad('loading');
    refresh().then(() => setLoad('ok'), () => setLoad('error'));
  }, [refresh]);

  useEffect(() => {
    loadAll();
    return () => {
      clearInterval(timerRef.current);
      audioRef.current?.pause();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      stopSpeaking();
    };
  }, [loadAll]);

  // ── audio playback ──
  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
  };

  const startAudio = (url: string, dur: number) => {
    stopAudio();
    stopSpeaking();
    const a = new Audio(url);
    a.ontimeupdate = () => {
      const d = isFinite(a.duration) && a.duration > 0 ? a.duration : dur;
      if (d) setProg(Math.min(100, (a.currentTime / d) * 100));
    };
    a.onended = () => {
      audioRef.current = null;
      setPlaying(false);
      setProg(100);
    };
    a.play().catch(() => setPlaying(false));
    audioRef.current = a;
    setPlaying(true);
    setProg(0);
  };

  const togglePlay = (url: string, dur: number) => {
    if (playing) {
      stopAudio();
      setPlaying(false);
      setProg(0);
    } else startAudio(url, dur);
  };

  // ── navigation ──
  const go = (next: Screen, opts: { vi?: number; list?: Memory[] } = {}) => {
    stopAudio();
    setScr(next);
    setConfirm(false);
    setPlaying(false);
    setProg(0);
    if (opts.vi != null) setVi(opts.vi);
    const idx = opts.vi ?? vi;
    say(next === 'view' ? memSay((opts.list ?? mems)[idx]) : SAY[next]);
  };

  const goToday = (i: number) => {
    const m = daily[i];
    if (!m) return go('todayDone');
    stopAudio();
    setScr('today');
    setTi(i);
    setConfirm(false);
    setPlaying(false);
    setProg(0);
    if (m.voiceUrl) startAudio(m.voiceUrl, m.voiceDurationSec);
    else say(memSay(m));
  };

  const headSay = () => {
    if (scr === 'home') return mems.length ? 'สวัสดีค่ะ มีรูปเก็บไว้ ' + mems.length + ' รูป' : 'สวัสดีค่ะ มาเริ่มเก็บรูปแรกกันค่ะ';
    if (scr === 'view') return memSay(mems[vi]);
    if (scr === 'today') return memSay(daily[ti]);
    return SAY[scr];
  };
  const onSayHead = () => say(headSay(), true);

  // ── adding a photo ──
  const resetDraftVoice = () => {
    if (voice) URL.revokeObjectURL(voice.url);
    setVoice(null);
    setRec('idle');
    setRecSec(0);
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy('กำลังเตรียมรูป…');
    const blob = await shrinkImage(f);
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft({ blob, url: URL.createObjectURL(blob), relation: askWho ? null : 'ครอบครัว' });
    resetDraftVoice();
    setMicErr(false);
    setSaveErr(false);
    setBusy(null);
    go(askWho ? 'who' : 'tell');
  };

  const pickRel = (relation: string) => {
    setDraft(d => (d ? { ...d, relation } : d));
    go('tell');
  };

  const stopRec = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const startRec = async () => {
    stopAudio();
    setPlaying(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = ev => { if (ev.data?.size) chunks.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
        if (scrRef.current !== 'tell') return setRec('idle');
        const b = new Blob(chunks, { type: mr.mimeType || 'audio/mp4' });
        setVoice({ blob: b, url: URL.createObjectURL(b) });
        setRec('done');
      };
      recorderRef.current = mr;
      stopSpeaking();
      mr.start();
      if (voice) URL.revokeObjectURL(voice.url);
      setVoice(null);
      setRec('on');
      setRecSec(0);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setRecSec(n => n + 1), 1000);
    } catch {
      setMicErr(true);
      setRec('idle');
    }
  };

  useEffect(() => {
    if (rec === 'on' && recSec >= MAX_REC_SEC) stopRec();
  }, [rec, recSec]);

  const save = async () => {
    if (!draft) return;
    stopAudio();
    setPlaying(false);
    setBusy('กำลังเก็บรูป…');
    try {
      const m = await api.createMemory({ image: draft.blob, relation: draft.relation || 'ครอบครัว', voice: voice?.blob, voiceDurationSec: recSec });
      await refresh().catch(() => setMems(ms => ms.concat(m)));
      URL.revokeObjectURL(draft.url);
      setDraft(null);
      resetDraftVoice();
      setSaveErr(false);
      setLastSaved(m);
      go('saved');
    } catch {
      setSaveErr(true);
      say('เก็บรูปไม่สำเร็จ ลองกดเก็บอีกครั้งนะคะ');
    } finally {
      setBusy(null);
    }
  };

  // ── viewing ──
  const del = async () => {
    const m = mems[vi];
    if (!m) return;
    setBusy('กำลังลบรูป…');
    try {
      await api.deleteMemory(m.id);
      const rest = await refresh().catch(() => mems.filter(x => x.id !== m.id));
      if (!rest.length) go('home');
      else go('view', { vi: Math.min(vi, rest.length - 1), list: rest });
    } catch {
      setConfirm(false);
    } finally {
      setBusy(null);
    }
  };

  const back = () => {
    if (rec === 'on') stopRec();
    if (scr === 'tell') {
      resetDraftVoice();
      go(askWho ? 'who' : 'shoot');
    } else if (scr === 'who') go('shoot');
    else go('home');
  };

  // ── derived values ──
  const n = mems.length;
  const cur = mems[vi];
  const tc = daily[ti];
  const recent = mems.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const showBack = ['shoot', 'who', 'tell', 'view', 'today'].includes(scr);
  const backLabel = scr === 'tell' && !askWho ? 'ถ่ายรูปใหม่' : BACK_LABEL[scr] || 'กลับ';
  const playIcon = playing ? '❚❚' : '▶';
  const progWidth: CSSProperties = { width: prog + '%' };

  return (
    <div className="blueprint mb-root">
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />

      {showBack && (
        <button onClick={back} className="btn btn-ghost mb-btn mb-back">‹ {backLabel}</button>
      )}

      {scr === 'home' && (
        <div className="mb-screen mb-pad">
          <div className="mb-grow" style={{ gap: 14 }}>
            <div className="mb-kicker">สมุดความทรงจำ</div>
            <button onClick={onSayHead} className="mb-say">
              <div className="mb-h1" style={{ fontSize: 46 }}>สวัสดีค่ะ</div>
              <div className="mb-sub" style={{ fontSize: 27, lineHeight: 1.4, marginTop: 8 }}>
                {load === 'loading' ? 'กำลังเปิดสมุด…'
                  : load === 'error' ? 'ตอนนี้เปิดสมุดไม่ได้ ลองใหม่อีกครั้งนะคะ'
                  : n ? 'มีรูปเก็บไว้ ' + n + ' รูป' : 'ยังไม่มีรูปเลย มาเริ่มเก็บรูปแรกกันค่ะ'}
              </div>
            </button>
            {n > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 10 }}>
                {recent.map(m => <div key={m.id} className="mb-thumb" style={bg(m.imageUrl)} />)}
              </div>
            )}
          </div>
          {load === 'error' && <Btn kind="primary" h={124} fs={33} onClick={loadAll}>ลองใหม่</Btn>}
          {load === 'ok' && n > 0 && (
            <>
              <Btn kind="primary" h={124} fs={33} onClick={() => goToday(0)}>ดูรูปวันนี้</Btn>
              <Btn kind="secondary" h={100} fs={30} onClick={() => go('shoot')}>+ เพิ่มรูปใหม่</Btn>
              <Btn kind="ghost" h={60} fs={23} onClick={() => go('view', { vi: 0 })}>ดูรูปทั้งหมด {n} รูป</Btn>
            </>
          )}
          {load === 'ok' && n === 0 && <Btn kind="primary" h={140} fs={34} onClick={() => go('shoot')}>+ เพิ่มรูปแรก</Btn>}
        </div>
      )}

      {scr === 'shoot' && (
        <div className="mb-screen" style={{ gap: 14, padding: 20 }}>
          <button onClick={onSayHead} className="mb-say mb-grow" style={{ gap: 12 }}>
            <div className="mb-h1" style={{ fontSize: 44 }}>ถ่ายรูปใหม่</div>
            <div className="mb-sub" style={{ fontSize: 26 }}>{SAY.shoot}</div>
          </button>
          <FileBtn kind="primary" h={140} fs={33} gap={18} capture onPick={onPick}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
            เปิดกล้อง
          </FileBtn>
          <FileBtn kind="secondary" h={100} fs={28} gap={14} onPick={onPick}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            เลือกรูปที่มีในเครื่อง
          </FileBtn>
        </div>
      )}

      {scr === 'who' && (
        <div className="mb-screen">
          <div className="mb-photo" style={{ height: 230, ...bg(draft?.url) }} />
          <button onClick={onSayHead} className="mb-say mb-h1" style={{ flex: 'none', padding: '20px 20px 14px', fontSize: 40 }}>ใครอยู่ในรูปนี้คะ</button>
          <div className="mb-rels">
            {RELS.map(r => (
              <button key={r} onClick={() => pickRel(r)} className="btn btn-secondary mb-btn" style={{ height: 'auto', minHeight: 88, fontSize: 32, fontWeight: 600 }}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {scr === 'tell' && renderTell()}

      {scr === 'saved' && (
        <div className="mb-screen mb-pad">
          <div className="mb-grow" style={{ gap: 18 }}>
            <div className="mb-thumb" style={{ width: 150, borderWidth: 2, ...bg(lastSaved?.imageUrl) }} />
            <div className="mb-h1" style={{ fontSize: 46 }}>เก็บไว้แล้วค่ะ</div>
            <div className="mb-sub" style={{ fontSize: 26 }}>ตอนนี้มีรูปเก็บไว้ {n} รูป</div>
          </div>
          <Btn kind="primary" h={118} fs={32} onClick={() => go('view', { vi: 0 })}>ดูรูปของฉัน</Btn>
          <Btn kind="secondary" h={100} fs={29} onClick={() => go('shoot')}>+ เพิ่มอีกรูป</Btn>
        </div>
      )}

      {scr === 'today' && tc && (
        <div className="mb-screen">
          <div className="mb-photo" style={{ height: 300, ...bg(tc.imageUrl) }} />
          <button onClick={onSayHead} className="mb-say mb-grow" style={{ gap: 8, padding: '16px 20px' }}>
            <div className="mb-h1" style={{ fontSize: 48, lineHeight: 1.15 }}>{tc.relation}</div>
            <div className="mb-sub" style={{ fontSize: 23, lineHeight: 1.4 }}>เก็บไว้เมื่อ {thDate(tc.createdAt)}</div>
          </button>
          <div className="mb-dots">
            {daily.map((x, k) => <i key={x.id} style={{ background: k <= ti ? '#1d1f20' : 'rgba(29,31,32,.22)' }} />)}
          </div>
          <div className="mb-actions">
            {tc.voiceUrl && (
              <>
                <Btn kind="primary" h={112} fs={30} gap={16} onClick={() => togglePlay(tc.voiceUrl!, tc.voiceDurationSec)}>
                  <span className="mb-play-icon">{playIcon}</span>{playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้อีกครั้ง'}
                </Btn>
                <div className="mb-progress"><div style={progWidth} /></div>
              </>
            )}
            <Btn kind={tc.voiceUrl ? 'secondary' : 'primary'} h={tc.voiceUrl ? 96 : 124} fs={30} onClick={() => goToday(ti + 1)}>
              {ti + 1 >= daily.length ? 'ดูครบแล้ว ›' : 'รูปต่อไป ›'}
            </Btn>
          </div>
        </div>
      )}

      {scr === 'todayDone' && (
        <div className="mb-screen mb-pad">
          <button onClick={onSayHead} className="mb-say mb-grow" style={{ gap: 14 }}>
            <div className="mb-h1" style={{ fontSize: 46 }}>วันนี้ดูครบแล้วค่ะ</div>
            <div className="mb-sub" style={{ fontSize: 26 }}>พรุ่งนี้จะมีรูปชุดใหม่ให้ดูค่ะ</div>
          </button>
          <Btn kind="primary" h={118} fs={32} onClick={() => go('shoot')}>+ เพิ่มรูปใหม่</Btn>
          <Btn kind="secondary" h={100} fs={29} onClick={() => go('home')}>กลับหน้าแรก</Btn>
        </div>
      )}

      {scr === 'view' && cur && (
        <div className="mb-screen">
          <div className="mb-photo" style={{ height: 300, ...bg(cur.imageUrl) }} />
          {!confirm ? (
            <>
              <button onClick={onSayHead} className="mb-say mb-grow" style={{ gap: 8, padding: '16px 20px' }}>
                <div className="mb-h1" style={{ fontSize: 48, lineHeight: 1.15 }}>{cur.relation}</div>
                <div className="mb-sub" style={{ fontSize: 23, lineHeight: 1.4 }}>
                  เก็บไว้เมื่อ {thDate(cur.createdAt)} · รูปที่ {vi + 1} จาก {n}
                </div>
              </button>
              <div className="mb-actions" style={{ paddingBottom: 16 }}>
                {cur.voiceUrl && (
                  <>
                    <Btn kind="primary" h={112} fs={30} gap={16} onClick={() => togglePlay(cur.voiceUrl!, cur.voiceDurationSec)}>
                      <span className="mb-play-icon">{playIcon}</span>{playing ? 'หยุดฟัง' : 'ฟังเรื่องที่เล่าไว้'}
                    </Btn>
                    <div className="mb-progress"><div style={progWidth} /></div>
                  </>
                )}
                <Btn kind="secondary" h={96} fs={29} onClick={() => (n > 1 ? go('view', { vi: (vi + 1) % n }) : go('home'))}>
                  {n > 1 ? 'รูปต่อไป ›' : 'กลับหน้าแรก'}
                </Btn>
                <Btn kind="ghost" h={56} fs={21} onClick={() => { stopAudio(); setPlaying(false); setConfirm(true); say('ลบรูปนี้ใช่ไหมคะ'); }}>ลบรูปนี้</Btn>
              </div>
            </>
          ) : (
            <div className="mb-screen" style={{ gap: 12, padding: 20 }}>
              <div className="mb-h1" style={{ flex: 1, display: 'flex', alignItems: 'center', fontSize: 40, lineHeight: 1.25 }}>ลบรูปนี้ใช่ไหมคะ</div>
              <Btn kind="primary" h={112} fs={31} onClick={() => setConfirm(false)}>ไม่ลบ เก็บไว้</Btn>
              <Btn kind="secondary" h={92} fs={27} onClick={del}>ลบเลย</Btn>
            </div>
          )}
        </div>
      )}

      {busy && <div className="mb-busy">{busy}</div>}
    </div>
  );

  function renderTell() {
    type TellBtn = { label: string; kind: Kind; h: number; fs: number; on: () => void };
    let title: string, hint: string, btns: TellBtn[];
    if (rec === 'on') {
      title = 'กำลังฟังอยู่ค่ะ · ' + fmt(recSec);
      hint = 'พูดได้เลย เล่าจบแล้วกดปุ่มข้างล่าง';
      btns = [{ label: '■  เล่าจบแล้ว', kind: 'primary', h: 150, fs: 34, on: stopRec }];
    } else if (rec === 'done' && voice) {
      title = 'เล่าไว้แล้ว ' + fmt(recSec);
      hint = 'ถ้าพอใจแล้ว กดเก็บรูปได้เลยค่ะ';
      btns = [
        { label: 'เก็บรูปนี้', kind: 'primary', h: 118, fs: 33, on: save },
        { label: playing ? '❚❚  หยุดฟัง' : '▶  ฟังที่เล่าไว้', kind: 'secondary', h: 88, fs: 27, on: () => togglePlay(voice.url, recSec) },
        { label: 'เล่าใหม่', kind: 'ghost', h: 56, fs: 22, on: startRec },
      ];
    } else if (micErr) {
      title = 'เครื่องนี้อัดเสียงไม่ได้';
      hint = 'ไม่เป็นไรค่ะ กดเก็บรูปได้เลย';
      btns = [{ label: 'เก็บรูปนี้', kind: 'primary', h: 130, fs: 33, on: save }];
    } else {
      title = 'เล่าเรื่องรูปนี้ให้ฟังหน่อยค่ะ';
      hint = 'ถ่ายที่ไหน ตอนไหน ใครอยู่ด้วย';
      btns = [
        { label: '●  กดแล้วเริ่มเล่า', kind: 'primary', h: 130, fs: 33, on: startRec },
        { label: 'ไม่เล่า เก็บรูปเลย', kind: 'secondary', h: 92, fs: 27, on: save },
      ];
    }
    if (saveErr && rec !== 'on') {
      title = 'เก็บรูปไม่สำเร็จ';
      hint = 'ลองกดเก็บอีกครั้งนะคะ';
    }
    return (
      <div className="mb-screen">
        <div className="mb-photo" style={{ height: 230, ...bg(draft?.url) }} />
        <button onClick={onSayHead} className="mb-say mb-grow" style={{ gap: 10, padding: '18px 20px' }}>
          <div className="mb-h1" style={{ fontSize: 38, lineHeight: 1.22, color: rec === 'on' ? 'var(--color-accent-800)' : INK }}>{title}</div>
          <div className="mb-sub" style={{ fontSize: 24 }}>{hint}</div>
        </button>
        <div className="mb-actions">
          {btns.map(b => <Btn key={b.label} kind={b.kind} h={b.h} fs={b.fs} onClick={b.on}>{b.label}</Btn>)}
        </div>
      </div>
    );
  }
}
