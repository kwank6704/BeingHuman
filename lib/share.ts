import type { Memory } from './api';
import { thDate } from './media';

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

/**
 * Opens the phone's share sheet (LINE, Messenger, …) with the photo attached,
 * falling back to a link where files can't be shared.
 */
export async function shareMemory(m: Memory): Promise<void> {
  const text = (m.caption ? m.caption + ' · ' : '') + 'รูป' + m.relation + ' เก็บไว้เมื่อ ' + thDate(m.createdAt);
  try {
    const blob = await (await fetch(m.imageUrl)).blob();
    const file = new File([blob], 'memory.jpg', { type: blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], text });
  } catch (e) {
    if ((e as Error).name === 'AbortError') return;
  }
  await navigator.share({ text, url: new URL(m.imageUrl, location.href).href });
}
