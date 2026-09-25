'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import * as api from '@/lib/api';
import { initAuth } from '@/lib/auth';
import type { Memory } from '@/lib/api';
import { speak, stopSpeaking } from '@/lib/speech';
import { greeting, localDay, rotateImage, shrinkImage, thDate } from '@/lib/media';
import { DEFAULTS, RATE, cacheSettings, cachedSettings, type Settings } from '@/lib/settings';
import { canShare, shareMemory } from '@/lib/share';
import { useAudio } from './useAudio';
import { useRecorder } from './useRecorder';

export type Screen =
  | 'welcome' | 'nickname' | 'textSize'
  | 'home' | 'settings'
  | 'shoot' | 'who' | 'name' | 'tell' | 'saved'
  | 'today' | 'todayDone'
  | 'albums' | 'view' | 'more' | 'confirmDelete' | 'slideshow';

/** 'all', 'fav', or a relation code. */
export type Album = string;

export const RELS = ['ลูก', 'หลาน', 'คู่ชีวิต', 'พี่น้อง', 'เพื่อน', 'ครอบครัว', 'ตัวเอง', 'สัตว์เลี้ยง', 'สถานที่'];
export const NICKNAMES = ['คุณยาย', 'คุณตา', 'คุณย่า', 'คุณปู่', 'คุณแม่', 'คุณพ่อ'];

export const SAY: Partial<Record<Screen, string>> = {
  welcome: 'สวัสดีค่ะ ยินดีต้อนรับสู่สมุดความทรงจำ สมุดนี้เก็บรูปคนที่รัก พร้อมเสียงเล่าเรื่องของคุณเองค่ะ',
  nickname: 'อยากให้เรียกว่าอะไรดีคะ',
  textSize: 'ตัวหนังสือขนาดไหนอ่านง่ายที่สุดคะ กดเลือกได้เลยค่ะ',
  settings: 'ตั้งค่า ปรับตัวหนังสือ สี และเสียงได้ที่นี่ค่ะ',
  shoot: 'ถ่ายรูปคนที่รัก หรือถ่ายรูปเก่าในอัลบั้มก็ได้ค่ะ',
  who: 'ใครอยู่ในรูปนี้คะ',
  name: 'รูปนี้ชื่ออะไรดีคะ พูดหรือพิมพ์ก็ได้ค่ะ',
  tell: 'เล่าให้ฟังหน่อยค่ะ รูปนี้ถ่ายที่ไหน ตอนไหน ใครอยู่ด้วย',
  saved: 'เก็บไว้แล้วค่ะ',
  todayDone: 'วันนี้ดูครบแล้วค่ะ พรุ่งนี้จะมีรูปชุดใหม่ให้ดูค่ะ',
  albums: 'อยากดูรูปของใครคะ',
  more: 'ทำอะไรกับรูปนี้ดีคะ',
  confirmDelete: 'ลบรูปนี้ใช่ไหมคะ',
};

export const memTitle = (m: Memory) => m.caption || m.relation;
export const memSay = (m: Memory | undefined) =>
  m ? (m.caption ? m.caption + ' ' : '') + 'รูป' + m.relation + ' เก็บไว้เมื่อ ' + thDate(m.createdAt) : '';

export function albumOf(mems: Memory[], album: Album): Memory[] {
  if (album === 'all') return mems;
  if (album === 'fav') return mems.filter(m => m.favorite);
  return mems.filter(m => m.relation === album);
}
export const albumName = (a: Album) => (a === 'all' ? 'ทุกรูป' : a === 'fav' ? 'รูปโปรด' : a);

type Draft = { blob: Blob; url: string; relation: string | null; caption: string | null };
export type Toast = { text: string; undo?: () => void };

const EDIT_SCREENS: Screen[] = ['who', 'name', 'tell'];

export function useBookState() {
  const [scr, setScr] = useState<Screen>('home');
  const [mems, setMems] = useState<Memory[]>([]);
  const [daily, setDaily] = useState<Memory[]>([]);
  const [load, setLoad] = useState<'loading' | 'ok' | 'error'>('loading');
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [nickname, setNick] = useState<string | null>(null);
  const [streak, setStreak] = useState<api.Streak>({ streak: 0, visitedToday: false });
  const [album, setAlbum] = useState<Album>('all');
  const [vi, setVi] = useState(0);
  const [ti, setTi] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [nameText, setNameText] = useState('');
  const [onboarding, setOnboarding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastSaved, setLastSaved] = useState<Memory | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState(false);
  const [shareOk, setShareOk] = useState(false);

  const scrRef = useRef(scr);
  scrRef.current = scr;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const loadedDay = useRef('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const audio = useAudio();
  const keepTake = useCallback(() => scrRef.current === 'tell', []);
  const recorder = useRecorder(keepTake);

  // ── speech, toasts, navigation ──
  const say = useCallback((text: string | undefined, force = false) => {
    const s = settingsRef.current;
    if (force || s.autoSpeak) speak(text, RATE[s.speechRate]);
  }, []);

  const showToast = (t: Toast) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), t.undo ? 9000 : 3500);
  };

  /** Switches screen; `speech` overrides what is read aloud (null = say nothing). */
  const go = (next: Screen, speech?: string | null) => {
    audio.stop();
    setScr(next);
    setZoom(null);
    const t = speech === undefined ? SAY[next] : speech;
    if (t) say(t);
    else stopSpeaking();
  };

  const homeSay = (count = mems.length) =>
    greeting() + (nickname ? ' ' + nickname : '') + ' ' + (count ? 'มีรูปเก็บไว้ ' + count + ' รูป' : 'มาเริ่มเก็บรูปแรกกันค่ะ');

  // ── loading ──
  const refresh = useCallback(async () => {
    const [all, today] = await Promise.all([api.listMemories(), api.todayMemories()]);
    setMems(all);
    setDaily(today);
    loadedDay.current = localDay();
    return all;
  }, []);

  const loadAll = useCallback(() => {
    setLoad('loading');
    initAuth()
      // Leaving for LINE's login page: stay on "กำลังเปิดสมุด…" until we come back.
      .then(r => (r === 'redirecting' ? new Promise<never>(() => {}) : Promise.all([refresh(), api.getMe()])))
      .then(([, me]) => {
        const s = { ...DEFAULTS, ...me.settings };
        setSettings(s);
        cacheSettings(s);
        setNick(me.nickname);
        setStreak({ streak: me.streak, visitedToday: me.visitedToday });
        setShareOk(canShare()); // LINE's friend picker is only known after logging in
        setLoad('ok');
        if (!s.onboarded) {
          setOnboarding(true);
          setScr('welcome');
          settingsRef.current = s;
          say(SAY.welcome);
        }
      }, () => setLoad('error'));
  }, [refresh, say]);

  useEffect(() => {
    const cached = cachedSettings();
    if (cached) setSettings(cached);
    setShareOk(canShare());
    loadAll();
    return () => {
      clearTimeout(toastTimer.current);
      stopSpeaking();
    };
  }, [loadAll]);

  // A new day brings a new set of "today's photos" even if the app was left open overnight.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !loadedDay.current || loadedDay.current === localDay()) return;
      refresh().catch(() => {});
      api.getMe().then(me => setStreak({ streak: me.streak, visitedToday: me.visitedToday }), () => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // ── settings & first run ──
  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    cacheSettings(next);
    api.updateMe({ settings: patch }).catch(() => {});
  };

  const chooseNickname = (n: string | null) => {
    setNick(n);
    api.updateMe({ nickname: n }).catch(() => {});
    if (onboarding) return go('textSize');
    go('settings', null);
    say(n ? 'จะเรียกว่า ' + n + ' นะคะ' : 'ได้ค่ะ', true);
  };

  const chooseTextSize = (textSize: Settings['textSize']) => {
    if (!onboarding) {
      updateSettings({ textSize });
      return say('เปลี่ยนขนาดตัวหนังสือแล้วค่ะ', true);
    }
    setOnboarding(false);
    updateSettings({ textSize, onboarded: true });
    go('home', 'เรียบร้อยค่ะ ' + homeSay());
  };

  // ── adding a photo ──
  const startAdd = () => {
    setEditId(null);
    setSaveErr(false);
    go('shoot');
  };

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setBusy('กำลังเตรียมรูป…');
    const blob = await shrinkImage(f);
    if (draft) URL.revokeObjectURL(draft.url);
    setDraft({ blob, url: URL.createObjectURL(blob), relation: null, caption: null });
    recorder.reset();
    setSaveErr(false);
    setBusy(null);
    go('who');
  };

  const rotateDraft = async () => {
    if (!draft) return;
    setBusy('กำลังหมุนรูป…');
    const blob = await rotateImage(draft.blob);
    URL.revokeObjectURL(draft.url);
    setDraft({ ...draft, blob, url: URL.createObjectURL(blob) });
    setBusy(null);
  };

  /** Shows memory `id` in the viewer, staying in the current album when it is still there. */
  const focus = (id: string, all: Memory[], a: Album = album) => {
    const keep = albumOf(all, a).some(m => m.id === id) ? a : 'all';
    setAlbum(keep);
    setVi(Math.max(0, albumOf(all, keep).findIndex(m => m.id === id)));
  };

  /** Applies an edit to a saved photo, then returns to it. Resolves false if it failed. */
  const mutate = async (run: () => Promise<Memory>, done: string): Promise<boolean> => {
    setBusy('กำลังเก็บ…');
    try {
      const m = await run();
      const all = await refresh().catch(() => {
        const l = mems.map(x => (x.id === m.id ? m : x));
        setMems(l);
        return l;
      });
      setEditId(null);
      focus(m.id, all);
      go('view', done);
      showToast({ text: done });
      return true;
    } catch {
      showToast({ text: 'ทำไม่สำเร็จ ลองใหม่อีกครั้งนะคะ' });
      say('ทำไม่สำเร็จ ลองใหม่อีกครั้งนะคะ');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const pickRel = (relation: string) => {
    if (editId) return void mutate(() => api.updateMemory(editId, { relation }), 'เปลี่ยนเป็นรูป' + relation + 'แล้วค่ะ');
    setDraft(d => (d ? { ...d, relation } : d));
    setNameText(draft?.caption ?? '');
    go('name');
  };

  const confirmName = (text: string) => {
    const caption = text.replace(/\s+/g, ' ').trim().slice(0, 80) || null;
    if (editId) return void mutate(() => api.updateMemory(editId, { caption }), caption ? 'เปลี่ยนชื่อรูปแล้วค่ะ' : 'เอาชื่อรูปออกแล้วค่ะ');
    setDraft(d => (d ? { ...d, caption } : d));
    go('tell');
  };

  const save = async () => {
    audio.stop();
    const take = recorder.voice;
    if (editId) {
      if (take && (await mutate(() => api.setVoice(editId, take.blob, recorder.sec), 'เก็บเรื่องที่เล่าแล้วค่ะ'))) recorder.reset();
      else if (take) setSaveErr(true);
      return;
    }
    if (!draft) return;
    setBusy('กำลังเก็บรูป…');
    try {
      const m = await api.createMemory({
        image: draft.blob,
        relation: draft.relation || 'ครอบครัว',
        caption: draft.caption,
        voice: take?.blob,
        voiceDurationSec: recorder.sec,
      });
      const all = await refresh().catch(() => {
        const l = mems.concat(m);
        setMems(l);
        return l;
      });
      URL.revokeObjectURL(draft.url);
      setDraft(null);
      recorder.reset();
      setSaveErr(false);
      setLastSaved(m);
      focus(m.id, all, 'all');
      go('saved', 'เก็บไว้แล้วค่ะ ตอนนี้มีรูปเก็บไว้ ' + all.length + ' รูป');
    } catch {
      setSaveErr(true);
      say('เก็บรูปไม่สำเร็จ ลองกดเก็บอีกครั้งนะคะ');
    } finally {
      setBusy(null);
    }
  };

  // ── today's photos ──
  const finishToday = () => {
    go('todayDone');
    api.visit().then(setStreak, () => {});
  };

  const goToday = (i: number) => {
    const m = daily[i];
    if (!m) return finishToday();
    setTi(i);
    go('today', m.voiceUrl ? null : memSay(m));
    if (m.voiceUrl) audio.play(m.voiceUrl, m.voiceDurationSec);
  };

  // ── browsing ──
  const list = albumOf(mems, album);
  const cur: Memory | undefined = list[Math.min(vi, list.length - 1)];
  const editing = editId ? mems.find(m => m.id === editId) : undefined;

  const openAlbum = (a: Album) => {
    setAlbum(a);
    setVi(0);
    go('view', memSay(albumOf(mems, a)[0]));
  };

  const step = (d: number) => {
    if (!list.length) return;
    const i = (Math.min(vi, list.length - 1) + d + list.length) % list.length;
    setVi(i);
    go('view', memSay(list[i]));
  };

  const toggleFav = (m: Memory) => {
    const favorite = !m.favorite;
    setMems(ms => ms.map(x => (x.id === m.id ? { ...x, favorite } : x)));
    say(favorite ? 'เก็บเป็นรูปโปรดแล้วค่ะ' : 'เอาออกจากรูปโปรดแล้วค่ะ', true);
    api.updateMemory(m.id, { favorite }).catch(() => {
      setMems(ms => ms.map(x => (x.id === m.id ? { ...x, favorite: m.favorite } : x)));
      showToast({ text: 'ทำไม่สำเร็จ ลองใหม่อีกครั้งนะคะ' });
    });
  };

  const editWho = () => { if (cur) { setEditId(cur.id); go('who', 'ใครอยู่ในรูปนี้คะ'); } };
  const editName = () => { if (cur) { setEditId(cur.id); setNameText(cur.caption ?? ''); go('name'); } };
  const editStory = () => {
    if (!cur) return;
    setEditId(cur.id);
    recorder.reset();
    setSaveErr(false);
    go('tell');
  };

  const share = (m: Memory) => {
    audio.stop();
    stopSpeaking();
    shareMemory(m).then(
      sent => { if (sent) { showToast({ text: 'ส่งรูปให้แล้วค่ะ' }); say('ส่งรูปให้แล้วค่ะ'); } },
      () => showToast({ text: 'ส่งไม่สำเร็จ ลองใหม่อีกครั้งนะคะ' }),
    );
  };

  const restore = async (m: Memory) => {
    clearTimeout(toastTimer.current);
    setToast(null);
    setBusy('กำลังเอารูปคืน…');
    try {
      await api.restoreMemory(m.id);
      const all = await refresh();
      focus(m.id, all);
      go('view', 'เอารูปคืนแล้วค่ะ');
    } catch {
      showToast({ text: 'เอารูปคืนไม่สำเร็จ ลองใหม่อีกครั้งนะคะ' });
    } finally {
      setBusy(null);
    }
  };

  const del = async () => {
    const m = cur;
    if (!m) return;
    setBusy('กำลังลบรูป…');
    try {
      await api.deleteMemory(m.id);
      const all = mems.filter(x => x.id !== m.id);
      setMems(all);
      setDaily(d => d.filter(x => x.id !== m.id));
      const left = albumOf(all, album);
      if (!all.length) go('home', null);
      else if (!left.length) go('albums', null);
      else {
        setVi(Math.min(vi, left.length - 1));
        go('view', null);
      }
      showToast({ text: 'ลบรูปแล้ว', undo: () => restore(m) });
      say('ลบรูปแล้วค่ะ ถ้าลบผิด กดเอาคืนได้ค่ะ');
    } catch {
      showToast({ text: 'ลบไม่สำเร็จ ลองใหม่อีกครั้งนะคะ' });
      go('view', null);
    } finally {
      setBusy(null);
    }
  };

  const startSlideshow = (a: Album) => {
    setAlbum(a);
    setVi(0);
    go('slideshow', null);
  };

  // ── back button ──
  const back = () => {
    recorder.stop();
    if (editId && EDIT_SCREENS.includes(scr)) {
      recorder.reset();
      setEditId(null);
      return go('view', null);
    }
    switch (scr) {
      case 'who': return go('shoot');
      case 'name': return go('who');
      case 'tell': recorder.reset(); return go('name');
      case 'view': return go('albums');
      case 'more': return go('view', null);
      case 'nickname': return onboarding ? go('welcome') : go('settings', null);
      case 'textSize': return onboarding ? go('nickname') : go('settings', null);
      default: return go('home', homeSay());
    }
  };

  const backLabel = (() => {
    if (editId && EDIT_SCREENS.includes(scr)) return 'กลับไปที่รูป';
    switch (scr) {
      case 'who': return 'ถ่ายรูปใหม่';
      case 'name': return 'เลือกคนใหม่';
      case 'tell': return 'แก้ชื่อรูป';
      case 'view': return 'เลือกกลุ่มรูป';
      case 'more': return 'กลับไปที่รูป';
      case 'nickname': case 'textSize': return onboarding ? 'ย้อนกลับ' : 'กลับไปตั้งค่า';
      default: return 'กลับหน้าแรก';
    }
  })();
  const showBack = !['welcome', 'home', 'saved', 'todayDone', 'slideshow', 'confirmDelete'].includes(scr);

  return {
    scr, go, back, backLabel, showBack, say, homeSay,
    mems, daily, load, loadAll, settings, updateSettings, nickname, streak, onboarding,
    chooseNickname, chooseTextSize,
    album, list, vi, cur, ti, openAlbum, step, toggleFav, startSlideshow,
    draft, editId, editing, nameText, setNameText, lastSaved, saveErr,
    startAdd, onPick, rotateDraft, pickRel, confirmName, save,
    goToday, editWho, editName, editStory, share, shareOk, del,
    audio, recorder, busy, toast, zoom, setZoom,
  };
}
