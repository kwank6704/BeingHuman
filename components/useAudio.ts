import { useEffect, useRef, useState } from 'react';
import { stopSpeaking } from '@/lib/speech';

/** One audio clip at a time: the story of the photo on screen, or the one just recorded. */
export function useAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);

  const stop = () => {
    const a = ref.current;
    if (a) {
      a.onended = a.onerror = a.ontimeupdate = null;
      a.pause();
    }
    ref.current = null;
    setPlaying(false);
    setProg(0);
  };

  /** Plays `url`; `onEnd` runs when it finishes or fails to play (not when stopped). */
  const play = (url: string, dur: number, onEnd?: () => void) => {
    stop();
    stopSpeaking();
    const a = new Audio(url);
    const finish = () => {
      ref.current = null;
      setPlaying(false);
      setProg(100);
      onEnd?.();
    };
    a.ontimeupdate = () => {
      const d = isFinite(a.duration) && a.duration > 0 ? a.duration : dur;
      if (d) setProg(Math.min(100, (a.currentTime / d) * 100));
    };
    a.onended = finish;
    a.onerror = finish;
    a.play().catch(() => { if (ref.current === a) finish(); });
    ref.current = a;
    setPlaying(true);
    setProg(0);
  };

  const toggle = (url: string, dur: number) => (playing ? stop() : play(url, dur));

  useEffect(() => () => ref.current?.pause(), []);

  return { playing, prog, play, stop, toggle };
}
