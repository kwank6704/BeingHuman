import { useCallback, useEffect, useRef, useState } from 'react';
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
  // Microphone level for the live waveform while recording.
  const meter = useRef<{ ctx: AudioContext; analyser: AnalyserNode; buf: Float32Array<ArrayBuffer> } | null>(null);

  /** Loudness right now, 0–1 (0 when not recording). */
  const level = useCallback(() => {
    const m = meter.current;
    if (!m) return 0;
    m.analyser.getFloatTimeDomainData(m.buf);
    let sum = 0;
    for (const v of m.buf) sum += v * v;
    return Math.min(1, Math.sqrt(sum / m.buf.length) * 5);
  }, []);

  const closeMeter = () => {
    meter.current?.ctx.close().catch(() => {});
    meter.current = null;
  };

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
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        ctx.createMediaStreamSource(stream).connect(analyser);
        closeMeter();
        meter.current = { ctx, analyser, buf: new Float32Array(analyser.fftSize) };
      } catch {
        // No meter: the waveform just stays flat; recording still works.
      }
      mr.onstop = () => {
        closeMeter();
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
    closeMeter();
    discard.current = true;
    clearInterval(timer.current);
    if (mrRef.current?.state === 'recording') mrRef.current.stop();
  }, []);

  return { state, sec, voice, micErr, start, stop, reset, level };
}
