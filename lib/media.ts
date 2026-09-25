function draw(file: Blob, paint: (img: HTMLImageElement, c: HTMLCanvasElement) => void): Promise<Blob> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      paint(img, c);
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

/** Downscales a photo to at most 1400px on its long side, as JPEG. */
export function shrinkImage(file: Blob): Promise<Blob> {
  return draw(file, (img, c) => {
    const k = Math.min(1, 1400 / Math.max(img.width, img.height));
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  });
}

/** Turns a photo a quarter turn clockwise (for pictures of album pages taken sideways). */
export function rotateImage(file: Blob): Promise<Blob> {
  return draw(file, (img, c) => {
    c.width = img.height;
    c.height = img.width;
    const g = c.getContext('2d')!;
    g.translate(c.width, 0);
    g.rotate(Math.PI / 2);
    g.drawImage(img, 0, 0);
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

/** Today's date on this device, e.g. "วันพฤหัสบดีที่ 25 กันยายน". */
export function thToday(): string {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** YYYY-MM-DD on this device, to notice when the day has changed. */
export function localDay(): string {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export function greeting(hour = new Date().getHours()): string {
  if (hour >= 5 && hour < 11) return 'สวัสดีตอนเช้าค่ะ';
  if (hour >= 11 && hour < 16) return 'สวัสดีตอนบ่ายค่ะ';
  if (hour >= 16 && hour < 19) return 'สวัสดีตอนเย็นค่ะ';
  return 'สวัสดีค่ะ';
}

export const bg = (url: string | null | undefined) => (url ? { backgroundImage: `url("${url}")` } : undefined);
