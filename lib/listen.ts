/**
 * Thai speech-to-text with the browser's SpeechRecognition (Chrome on Android, Safari on iOS).
 * Lets the elder say a name instead of typing it.
 */

type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

function ctor(): (new () => Recognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, new () => Recognition>;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

export const canListen = () => !!ctor();

/**
 * Starts listening; `onText` gets the words heard so far. `done` resolves with the final
 * text ('' if nothing was heard) and rejects if the microphone is not allowed.
 */
export function listen(onText: (text: string) => void): { done: Promise<string>; stop: () => void } {
  const Ctor = ctor();
  if (!Ctor) return { done: Promise.reject(new Error('unsupported')), stop: () => {} };
  const r = new Ctor();
  r.lang = 'th-TH';
  r.interimResults = true;
  r.maxAlternatives = 1;
  let text = '';
  const done = new Promise<string>((resolve, reject) => {
    r.onresult = e => {
      text = Array.from(e.results).map(x => x[0].transcript).join('').trim();
      onText(text);
    };
    r.onerror = e => (e.error === 'no-speech' || e.error === 'aborted' ? resolve(text) : reject(new Error(e.error)));
    r.onend = () => resolve(text);
  });
  r.start();
  return { done, stop: () => r.stop() };
}
