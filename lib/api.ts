import { getUserId } from './user';

export type Memory = {
  id: string;
  relation: string;
  imageUrl: string;
  voiceUrl: string | null;
  voiceDurationSec: number;
  createdAt: string;
};

// Empty = same origin; next.config.ts proxies /api and /media to the backend.
const BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { 'X-User-Id': getUserId(), ...init.headers },
  });
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export async function listMemories(): Promise<Memory[]> {
  return (await call<{ memories: Memory[] }>('/memories')).memories;
}

/** Today's photos, chosen server-side so they stay the same all day. */
export async function todayMemories(): Promise<Memory[]> {
  return (await call<{ memories: Memory[] }>('/memories/today')).memories;
}

export async function createMemory(input: {
  image: Blob;
  relation: string;
  voice?: Blob | null;
  voiceDurationSec?: number;
}): Promise<Memory> {
  const fd = new FormData();
  fd.append('image', input.image, 'photo.jpg');
  fd.append('relation', input.relation);
  if (input.voice) {
    fd.append('voice', input.voice, 'voice');
    fd.append('voiceDurationSec', String(input.voiceDurationSec ?? 0));
  }
  return (await call<{ memory: Memory }>('/memories', { method: 'POST', body: fd })).memory;
}

export async function deleteMemory(id: string): Promise<void> {
  await call<void>(`/memories/${id}`, { method: 'DELETE' });
}
