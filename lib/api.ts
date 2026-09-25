import { authHeaders, relogin } from './auth';
import type { Settings } from './settings';

export type Memory = {
  id: string;
  relation: string;
  caption: string | null;
  favorite: boolean;
  imageUrl: string;
  voiceUrl: string | null;
  voiceDurationSec: number;
  createdAt: string;
};

export type Streak = { streak: number; visitedToday: boolean };
export type Profile = Streak & { nickname: string | null; settings: Partial<Settings> };

// Empty = same origin; next.config.ts proxies /api and /media to the backend.
const BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init.headers },
  });
  // An expired LINE token: go get a new one (the page reloads, so this call never resolves).
  if (res.status === 401 && (await relogin())) return new Promise<T>(() => {});
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} → ${res.status}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

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
  caption?: string | null;
  voice?: Blob | null;
  voiceDurationSec?: number;
}): Promise<Memory> {
  const fd = new FormData();
  fd.append('image', input.image, 'photo.jpg');
  fd.append('relation', input.relation);
  if (input.caption) fd.append('caption', input.caption);
  if (input.voice) {
    fd.append('voice', input.voice, 'voice');
    fd.append('voiceDurationSec', String(input.voiceDurationSec ?? 0));
  }
  return (await call<{ memory: Memory }>('/memories', { method: 'POST', body: fd })).memory;
}

export async function updateMemory(id: string, patch: { relation?: string; caption?: string | null; favorite?: boolean }): Promise<Memory> {
  return (await call<{ memory: Memory }>(`/memories/${id}`, json('PATCH', patch))).memory;
}

/** Records (or replaces) the story of a photo already in the book. */
export async function setVoice(id: string, voice: Blob, durationSec: number): Promise<Memory> {
  const fd = new FormData();
  fd.append('voice', voice, 'voice');
  fd.append('voiceDurationSec', String(durationSec));
  return (await call<{ memory: Memory }>(`/memories/${id}/voice`, { method: 'PUT', body: fd })).memory;
}

/** Hides the photo; it can be brought back with restoreMemory for a week. */
export async function deleteMemory(id: string): Promise<void> {
  await call<void>(`/memories/${id}`, { method: 'DELETE' });
}

export async function restoreMemory(id: string): Promise<Memory> {
  return (await call<{ memory: Memory }>(`/memories/${id}/restore`, { method: 'POST' })).memory;
}

export async function getMe(): Promise<Profile> {
  return call<Profile>('/me');
}

export async function updateMe(patch: { nickname?: string | null; settings?: Partial<Settings> }): Promise<Profile> {
  return call<Profile>('/me', json('PATCH', patch));
}

/** Marks today's photos as seen and returns the streak. */
export async function visit(): Promise<Streak> {
  return call<Streak>('/me/visit', { method: 'POST' });
}
