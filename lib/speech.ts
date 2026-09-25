/** Reads Thai text aloud with the browser's speech synthesis, if available. */
export function speak(text: string | undefined, rate = 0.9) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'th-TH';
  u.rate = rate;
  const v = speechSynthesis.getVoices().find(x => /^th/i.test(x.lang));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) speechSynthesis.cancel();
}
