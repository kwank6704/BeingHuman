import { useEffect, useRef, useState } from 'react';
import { stopSpeaking } from '@/lib/speech';

export const MAX_REC_SEC = 180;

export type Voice = { blob: Blob; url: string };

/**
 * Microphone recording of a photo's story. `keep()` is asked when recording stops:
 * if the elder has already left the screen, the take is thrown away.
 */
export function useRecorder(keep: () => boolean) {
  const [state, setState] = useState<'idle' | 'on' | 'done'>('idle');
  const [sec, setSec] = useState(0);
  const [voice, setVoiceState] = useState<Voice | null>(null);
  const [micErr, setMicErr] = useState(false);
  const mrRef = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const voiceRef = useRef<Voice | null>(null);
  const discard = useRef(false);

  const setVoice = (v: Voice | null) => {
    if (voiceRef.current && voiceRef.current !== v) URL.revokeObjectURL(voiceRef.current.url);
    voiceRef.current = v;
    setVoiceState(v);
  };

  const stop = () => {
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
  };

  /** Throws away any take (and stops one in progress). */
  const reset = () => {
    discard.current = true;
    stop();
    setVoice(null);
    setState('idle');
    setSec(0);
    setMicErr(false);
  };

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      discard.current = false;
      mr.ondataavailable = ev => { if (ev.data?.size) chunks.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timer.current);
        if (discard.current || !keep()) return setState('idle');
        const b = new Blob(chunks, { type: mr.mimeType || 'audio/mp4' });
        setVoice({ blob: b, url: URL.createObjectURL(b) });
        setState('done');
      };
      mrRef.current = mr;
      stopSpeaking();
      mr.start();
      setVoice(null);
      setState('on');
      setSec(0);
      setMicErr(false);
      clearInterval(timer.current);
      timer.current = setInterval(() => setSec(n => n + 1), 1000);
    } catch {
      setMicErr(true);
      setState('idle');
    }
  };

  useEffect(() => {
    if (state === 'on' && sec >= MAX_REC_SEC) stop();
  }, [state, sec]);

  useEffect(() => () => {
    discard.current = true;
    clearInterval(timer.current);
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
  }, []);

  return { state, sec, voice, micErr, start, stop, reset };
}
