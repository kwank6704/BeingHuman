import type { Memory } from './api';
import { lineShareApi } from './auth';
import { thDate } from './media';

/** True when there is a way to send a photo: LINE's friend picker, or the phone's share sheet. */
export const canShare = () => !!lineShareApi() || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');

/**
 * Sends a photo to family. Inside LINE this opens LINE's friend/group picker and posts the photo as a
 * card; elsewhere it opens the phone's share sheet. Resolves false if the elder closed it without sending.
 */
export async function shareMemory(m: Memory): Promise<boolean> {
  const title = m.caption || 'รูป' + m.relation;
  const sub = (m.caption ? 'รูป' + m.relation + ' · ' : 'เก็บไว้เมื่อ ') + thDate(m.createdAt);
  // LINE's servers fetch the image, so it needs a full https address.
  const imageUrl = new URL(m.imageUrl, location.href).href;

  const liff = lineShareApi();
  if (liff) {
    const res = await liff.shareTargetPicker([{
      type: 'flex',
      altText: 'ส่งรูปจากสมุดความทรงจำ: ' + title,
      contents: {
        type: 'bubble',
        hero: {
          type: 'image', url: imageUrl, size: 'full', aspectRatio: '4:3', aspectMode: 'fit',
          backgroundColor: '#e7e7ea', action: { type: 'uri', label: 'ดูรูป', uri: imageUrl },
        },
        body: {
          type: 'box', layout: 'vertical', spacing: 'sm',
          contents: [
            { type: 'text', text: title, weight: 'bold', size: 'xl', wrap: true },
            { type: 'text', text: sub, size: 'sm', color: '#5d5d60', wrap: true },
            { type: 'text', text: 'จากสมุดความทรงจำ', size: 'xs', color: '#416180', margin: 'md' },
          ],
        },
      },
    }], { isMultiple: true });
    return !!res;
  }

  const text = title + ' · ' + sub;
  try {
    const blob = await (await fetch(m.imageUrl)).blob();
    const file = new File([blob], 'memory.jpg', { type: blob.type || 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return true;
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return false;
  }
  await navigator.share({ text, url: imageUrl });
  return true;
}
