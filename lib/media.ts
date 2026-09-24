/** Downscales a photo to at most 1400px on its long side, as JPEG. */
export function shrinkImage(file: Blob): Promise<Blob> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => resolve(b || file), 'image/jpeg', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export function fmt(sec: number): string {
  const s = Math.round(sec || 0);
  const r = s % 60;
  return Math.floor(s / 60) + ':' + (r < 10 ? '0' + r : r);
}

export function thDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

export const bg = (url: string | null | undefined) => (url ? { backgroundImage: `url("${url}")` } : undefined);
