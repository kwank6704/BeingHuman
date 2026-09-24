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

`npm run seed` สร้างตาราง และใส่รูปตัวอย่าง 4 รูปของผู้ใช้ `demo` ถ้าเห็น `applied 001_init.sql` และ `seeded 001_demo.sql` แปลว่าสำเร็จ ขั้นนี้ทำครั้งเดียว terminal นี้ปิดได้เลย

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

เปิด **http://localhost:3000** จะเห็น "สวัสดีค่ะ · มีรูปเก็บไว้ 4 รูป" (แนะนำให้กด F12 แล้วสลับเป็นมุมมองมือถือ)

### ครั้งต่อไป

เปิด Docker Desktop แล้วรัน `npm run dev` ใน BeingHuman-BE และ BeingHuman ไม่ต้องทำขั้น 3 ซ้ำ

### ตั้งค่า (`.env.local`)

| ตัวแปร | ความหมาย |
| --- | --- |
| `API_URL` | ที่อยู่ backend (ค่าเริ่มต้น `http://localhost:4000`) หน้าเว็บจะส่งต่อ `/api` และ `/media` ไปที่นี่ |
| `NEXT_PUBLIC_USER_ID` | `demo` = ดูสมุดตัวอย่าง, เว้นว่าง = แต่ละเครื่องได้สมุดของตัวเอง (ต้องรีสตาร์ท `npm run dev` หลังแก้) |
| `ALLOWED_DEV_ORIGINS` | ใส่ IP ของเครื่องนี้ ถ้าจะเปิดจากมือถือผ่าน `http://<IP>:3000` |

### ล้างข้อมูลกลับเป็นค่าเริ่มต้น

- เฉพาะสมุด `demo`: `npm run seed` ใน BeingHuman-Database
- ล้างทุกอย่าง: `npm run reset` ใน BeingHuman-Database แล้วลบทุกอย่างใน `BeingHuman-BE/storage/` **ยกเว้นโฟลเดอร์ `demo`**

### เจอปัญหา

| อาการ | วิธีแก้ |
| --- | --- |
| `npm run db:up` error เรื่อง docker / pipe | เปิด Docker Desktop แล้วรอจนขึ้นว่า running |
| `port is already allocated` ตอน `db:up` | มี Postgres อื่นใช้ port 5432 อยู่ ปิดตัวนั้นก่อน |
| หน้าเว็บขึ้น "ตอนนี้เปิดสมุดไม่ได้" | backend ไม่ได้รัน หรือยังไม่ได้ `npm run seed` |
| อัดเสียงไม่ได้ ("เครื่องนี้อัดเสียงไม่ได้") | ไมค์ใช้ได้เฉพาะ `localhost` หรือ HTTPS เปิดผ่าน IP แบบ http จะอัดไม่ได้ |

## Screens

Built from the `MemoryBookApp` prototype (`Memory Book Final.dc.html`):

- **หน้าแรก** — greeting, photo count, 3 recent thumbnails; ดูรูปวันนี้ / + เพิ่มรูปใหม่ / ดูรูปทั้งหมด. Empty state: + เพิ่มรูปแรก.
- **รูปวันนี้** — 3 photos picked by the server per day; plays the recorded story automatically (or reads the caption), progress dots, then ดูครบแล้ว.
- **เพิ่มรูป** — camera or gallery → ใครอยู่ในรูป (ลูก/หลาน/คู่ชีวิต/พี่น้อง/เพื่อน/ตัวเอง) → record a story (up to 3 min, re-record, listen back) or skip → เก็บแล้ว.
- **ดูรูปทั้งหมด** — one photo at a time grouped by relation, play story, next, delete with a big "ไม่ลบ เก็บไว้" default.

Code: `components/MemoryBookApp.tsx` (screen state machine), `lib/api.ts` (API client), `lib/media.ts`
(client-side downscale to 1400px JPEG), `lib/speech.ts` (TTS). Styling: `app/industry.css` is the Industry design
system; `app/globals.css` holds the app layer. Sizes are deliberate accessibility values — keep captions ≥36px and
buttons ≥56px.

## Next steps

- LINE LIFF: call `liff.init`, use the profile `userId` in `lib/user.ts`, and send the ID token for the API to verify.
- Microphone recording requires HTTPS (or localhost).
