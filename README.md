# BeingHuman

Next.js (App Router, React 19) frontend for **สมุดความทรงจำ** — a photo memory book for Thai elders with poor
eyesight. One large action per screen; headings are read aloud (Thai TTS) and can be tapped to hear them again.

| Repo | Role |
| --- | --- |
| BeingHuman | this repo — web app |
| [BeingHuman-BE](https://github.com/kwank6704/BeingHuman-BE) | Express API + media storage |
| [BeingHuman-Database](https://github.com/kwank6704/BeingHuman-Database) | PostgreSQL schema + seed |

## วิธีรันในเครื่อง (Getting started)

แอปนี้ต้องรัน 3 ส่วนพร้อมกัน: ฐานข้อมูล (Docker), backend (port 4000) และหน้าเว็บ (port 3000)

### 1. ติดตั้งก่อน

- [Node.js](https://nodejs.org) **20.9 ขึ้นไป** (เช็กด้วย `node -v`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — **ต้องเปิดโปรแกรมไว้** ก่อนรันขั้นที่ 3
- Git

### 2. Clone ทั้ง 3 repo ไว้ในโฟลเดอร์เดียวกัน

```bash
mkdir BeingHuman-app
cd BeingHuman-app
git clone https://github.com/kwank6704/BeingHuman.git
git clone https://github.com/kwank6704/BeingHuman-BE.git
git clone https://github.com/kwank6704/BeingHuman-Database.git
```

### 3. ฐานข้อมูล (terminal ที่ 1)

```bash
cd BeingHuman-Database
npm install
npm run db:up
npm run seed
```

`npm run seed` สร้างตาราง และใส่รูปตัวอย่าง 7 รูปของผู้ใช้ `demo` ถ้าเห็น `applied 001_init.sql` และ `seeded 001_demo.sql` แปลว่าสำเร็จ ขั้นนี้ทำครั้งเดียว terminal นี้ปิดได้เลย

### 4. Backend (terminal ที่ 2 — เปิดค้างไว้)

```bash
cd BeingHuman-BE
npm install
cp .env.example .env
npm run dev
```

ขึ้น `BeingHuman API on http://localhost:4000` แปลว่าพร้อม

### 5. หน้าเว็บ (terminal ที่ 3 — เปิดค้างไว้)

```bash
cd BeingHuman
npm install
cp .env.example .env.local
npm run dev
```

เปิด **http://localhost:3000** ครั้งแรกจะเจอหน้าต้อนรับ (เลือกคำเรียก + ขนาดตัวหนังสือ) แล้วจะเห็น "มีรูปเก็บไว้ 7 รูป" (แนะนำให้กด F12 แล้วสลับเป็นมุมมองมือถือ)

### ครั้งต่อไป

เปิด Docker Desktop แล้วรัน `npm run dev` ใน BeingHuman-BE และ BeingHuman ไม่ต้องทำขั้น 3 ซ้ำ

### ตั้งค่า (`.env.local`)

| ตัวแปร | ความหมาย |
| --- | --- |
| `API_URL` | ที่อยู่ backend (ค่าเริ่มต้น `http://localhost:4000`) หน้าเว็บจะส่งต่อ `/api` และ `/media` ไปที่นี่ |
| `NEXT_PUBLIC_USER_ID` | `demo` = ดูสมุดตัวอย่าง, เว้นว่าง = แต่ละเครื่องได้สมุดของตัวเอง (ต้องรีสตาร์ท `npm run dev` หลังแก้) |
| `NEXT_PUBLIC_LIFF_ID` | เว้นว่างไว้ตอนรันในเครื่อง — ใส่เมื่อจะใช้ LINE login (ดูหัวข้อ "LINE login") |
| `ALLOWED_DEV_ORIGINS` | ใส่ IP ของเครื่องนี้ ถ้าจะเปิดจากมือถือผ่าน `http://<IP>:3000` |

### ล้างข้อมูลกลับเป็นค่าเริ่มต้น

- เฉพาะสมุด `demo`: `npm run seed` ใน BeingHuman-Database
- ล้างทุกอย่าง: `npm run reset` ใน BeingHuman-Database แล้วลบโฟลเดอร์ `BeingHuman-BE/storage/` ทิ้ง (รูปตัวอย่างอยู่ใน `BeingHuman-BE/public/` ไม่หาย)

### เจอปัญหา

| อาการ | วิธีแก้ |
| --- | --- |
| `npm run db:up` error เรื่อง docker / pipe | เปิด Docker Desktop แล้วรอจนขึ้นว่า running |
| `port is already allocated` ตอน `db:up` | มี Postgres อื่นใช้ port 5432 อยู่ ปิดตัวนั้นก่อน |
| หน้าเว็บขึ้น "ตอนนี้เปิดสมุดไม่ได้" | backend ไม่ได้รัน หรือยังไม่ได้ `npm run seed` |
| อัดเสียงไม่ได้ ("เครื่องนี้อัดเสียงไม่ได้") | ไมค์ใช้ได้เฉพาะ `localhost` หรือ HTTPS เปิดผ่าน IP แบบ http จะอัดไม่ได้ |

## Deploy ขึ้น Vercel

ระบบบน Vercel มี 4 ชิ้น: **หน้าเว็บ** (โปรเจกต์ Vercel ที่ 1) → **backend** (โปรเจกต์ Vercel ที่ 2) → **Neon Postgres** (ข้อมูล) + **Vercel Blob** (ไฟล์รูป/เสียง)

ทำตามลำดับนี้ — หน้าเว็บต้องรู้ URL ของ backend ก่อน:

1. **Push ทั้ง 3 repo ขึ้น GitHub** (Vercel ดึงโค้ดจาก GitHub)
2. **Backend + ฐานข้อมูล + ที่เก็บไฟล์** — ทำตาม [BeingHuman-BE → Deploy ขึ้น Vercel](https://github.com/kwank6704/BeingHuman-BE#deploy-ขึ้น-vercel) ให้เสร็จก่อน จนเปิด `https://<backend>/health` แล้วเห็น `{"ok":true}`
3. **หน้าเว็บ** — บน [vercel.com](https://vercel.com) กด **Add New… → Project** → เลือก repo **BeingHuman** (Framework จะขึ้นเป็น Next.js เอง) → เปิด **Environment Variables** แล้วใส่:

   | Name | Value |
   | --- | --- |
   | `API_URL` | URL ของ backend เช่น `https://beinghuman-be.vercel.app` (ต้องขึ้นต้น `https://` ไม่มี `/` ท้าย) |
   | `NEXT_PUBLIC_USER_ID` | **เว้นว่าง** — ถ้าใส่ `demo` ทุกคนที่เปิดเว็บจะใช้ (และลบ) สมุดเล่มเดียวกัน |
   | `NEXT_PUBLIC_LIFF_ID` | LIFF ID เมื่อตั้ง LINE login แล้ว (ดูหัวข้อถัดไป) |

   แล้วกด **Deploy** — ถ้าลืมใส่ `API_URL` build จะ fail พร้อมข้อความ `API_URL must be set on Vercel…` ให้ใส่แล้ว **Redeploy**
4. **ทดสอบ** — เปิด URL ของหน้าเว็บบนมือถือ เพิ่มรูป อัดเสียง (บน Vercel เป็น HTTPS ไมค์จึงใช้ได้) แล้วกดดูรูป

`/api/*` และ `/media/*` ถูกส่งต่อไป backend โดย `next.config.ts` จึงไม่ต้องตั้ง CORS
หลัง deploy แล้ว แค่ push ขึ้น GitHub Vercel ก็ deploy ใหม่ให้เอง (ถ้าแก้ตัวแปร `NEXT_PUBLIC_*` ต้องกด Redeploy เพราะค่าถูกฝังตอน build)

## LINE login (LIFF)

เปิดสมุดจาก LINE แล้วสมุดจะผูกกับบัญชี LINE ของผู้ใช้ — เปลี่ยนมือถือหรือล้างข้อมูลเบราว์เซอร์ รูปก็ไม่หาย
ถ้าไม่ตั้งค่านี้ แอปจะใช้ id ของเครื่องเหมือนเดิม (เหมาะกับตอนพัฒนาในเครื่อง)

1. [LINE Developers Console](https://developers.line.biz/console/) → เลือก Provider เดียวกับ LINE OA → **Create a new channel → LINE Login**
   (App types: **Web app**) แล้วจด **Channel ID** (แท็บ Basic settings)
2. ในช่องนั้น แท็บ **LIFF → Add**
   - Size: **Full**
   - Endpoint URL: URL หน้าเว็บ เช่น `https://beinghuman-iota.vercel.app`
   - Scopes: ติ๊ก **openid** และ **profile** (ต้องมี openid ไม่งั้นจะไม่ได้ ID token)
   - แล้วจด **LIFF ID** (เช่น `2001234567-AbCdEfGh`) และ LIFF URL (`https://liff.line.me/<LIFF ID>`)
3. Vercel → โปรเจกต์ **backend** → Environment Variables → เพิ่ม `LINE_CHANNEL_ID` = Channel ID → Redeploy
4. Vercel → โปรเจกต์ **หน้าเว็บ** → เพิ่ม `NEXT_PUBLIC_LIFF_ID` = LIFF ID → **Redeploy** (ค่า `NEXT_PUBLIC_*` ฝังตอน build)
5. LINE OA Manager → **Rich menu** → ให้ปุ่มเปิด LIFF URL — ผู้สูงอายุกดจากแชต OA ก็เข้าสมุดได้เลย ไม่ต้อง login เอง
   (ส่งลิงก์ให้คนอื่น ให้ส่ง LIFF URL `https://liff.line.me/<LIFF ID>` ไม่ใช่ URL ของ Vercel — ถ้าเปิด URL Vercel บนมือถือ
   แอปจะพาไปเปิดใน LINE ให้เอง)
6. ช่อง LINE Login ยังเป็น **Developing** อยู่จะใช้ได้เฉพาะคนที่เป็น Admin/Tester ของช่อง — ทดสอบเสร็จแล้วกด **Publish**

เมื่อ backend มี `LINE_CHANNEL_ID` จะไม่รับ `X-User-Id` อีก ถ้ายังอยากโชว์สมุดตัวอย่าง ให้ตั้ง `ALLOW_DEVICE_IDS=true` ที่ backend
แล้วเปิดเว็บด้วย `?demo` ต่อท้าย เช่น `https://beinghuman-iota.vercel.app/?demo` — จะเปิดสมุด `demo` โดยไม่ต้อง login LINE
(ทุกคนที่เปิดลิงก์นี้ใช้สมุดเล่มเดียวกัน แก้/ลบได้ — `npm run seed` ใน BeingHuman-Database เพื่อคืนค่า)

## Screens

Built from the `MemoryBookApp` prototype, extended so an elder can run the whole book alone:

- **ต้อนรับ (first run)** — what the book is, "อยากให้เรียกว่าอะไร" (คุณยาย/คุณตา/…), then pick a text size by seeing it.
- **หน้าแรก** — greeting by time of day with their name, today's date, "ดูรูปมาแล้ว N วันติดกัน", 3 recent thumbnails;
  ดูรูปวันนี้ / + เพิ่มรูปใหม่ / ดูรูปทั้งหมด, and ⚙ ตั้งค่า.
- **รูปวันนี้** — 3 photos picked by the server per day; plays the story (or reads the name), then ดูครบแล้ว + streak.
- **เพิ่มรูป** — camera or gallery (↻ rotate) → ใครอยู่ในรูป (9 groups incl. สัตว์เลี้ยง, สถานที่) → ชื่อรูป
  (say it with speech-to-text, or type; optional) → record a story (up to 3 min) or skip → เก็บแล้ว.
- **ดูรูปทั้งหมด** — groups with cover photos (❤ รูปโปรด first), "เปิดดูทุกรูปเอง" hands-free slideshow
  (keeps the screen awake); viewer with ‹ › arrows, tap-to-zoom full screen, ❤ favourite, record a story for a photo
  that has none, and ⋯ to rename, change group, re-record, share to LINE (Web Share), or delete with **เอาคืน** (undo).
- **ตั้งค่า** — text size (3 steps, stored per user), light / high-contrast dark, read-aloud on/off and speed, name.

Code: `components/useBookState.ts` (all state + actions), `components/screens/*` (one component per screen, read state
via `useBook()`), `components/useAudio.ts` / `useRecorder.ts`, `lib/api.ts` (API client), `lib/listen.ts`
(speech-to-text), `lib/speech.ts` (TTS), `lib/share.ts`, `lib/media.ts` (downscale/rotate). Styling: `app/industry.css`
is the Industry design system; `app/globals.css` holds the app layer and the dark theme. Every font size is multiplied
by `--k` (text-size setting) — keep captions ≥36px and buttons ≥56px at the normal size.

## Next steps

- Books made before LINE login (per-device ids) are not moved to the LINE account automatically.
- Inside LINE, sharing could use `liff.shareTargetPicker` instead of the Web Share sheet.
- Microphone recording requires HTTPS (or localhost).
