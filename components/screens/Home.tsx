'use client';

import { greeting, thToday } from '@/lib/media';
import { lineLoggedIn } from '@/lib/auth';
import { RATE } from '@/lib/settings';
import { speak } from '@/lib/speech';
import { useBook } from '../book';
import { LoadingScreen } from '../Loading';
import { SAY } from '../useBookState';
import { CameraArt, Icon, SkyScene } from '../art';
import { Btn, H1, Polaroid, Say, Sub } from '../ui';
import { TextSizePicker } from './Welcome';

export function Home() {
  const b = useBook();
  const n = b.mems.length;
  const recent = b.mems.slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 3);
  if (b.load === 'loading') return <LoadingScreen />;
  const status =
    b.load === 'error' ? 'ตอนนี้เปิดสมุดไม่ได้ ลองใหม่อีกครั้งนะคะ'
    : n ? 'มีรูปเก็บไว้ ' + n + ' รูป' : 'ยังไม่มีรูปเลย มาเริ่มเก็บรูปแรกกันค่ะ';

  return (
    <div className="mb-screen">
      <div className="mb-hero">
        <SkyScene />
        <div className="mb-hero-bar">
          <span className="mb-pill">{thToday()}</span>
          {b.load === 'ok' && (
            <button type="button" className="mb-pill mb-pill-btn" onClick={() => b.go('settings')}>
              <Icon name="sliders" /> ตั้งค่า
            </button>
          )}
        </div>
      </div>
      <div className="mb-grow mb-pad" style={{ gap: 14, paddingTop: 18 }}>
        <Say text={b.load === 'ok' ? b.homeSay() : status} style={{ gap: 2 }}>
          <H1 fs={42}>{greeting()}</H1>
          {b.nickname && <H1 fs={38} style={{ color: 'var(--color-accent-700)' }}>{b.nickname}</H1>}
          <Sub fs={25} style={{ marginTop: 6 }}>{status}</Sub>
        </Say>
        {b.streak.streak > 0 && (
          <div className="mb-streak"><Icon name="flower" /> ดูรูปมาแล้ว {b.streak.streak} วันติดกัน</div>
        )}
        {n > 0 ? (
          <div className="mb-fan" aria-hidden>
            {recent.map((m, i) => (
              <Polaroid key={m.id} url={m.imageUrl} width="34%" rotate={[-7, 2, 8][i]} style={{ zIndex: i === 1 ? 2 : 1 }} />
            ))}
          </div>
        ) : b.load === 'ok' ? (
          <CameraArt />
        ) : null}
      </div>
      <div className="mb-actions">
        {b.load === 'error' && <Btn kind="primary" h={116} fs={32} icon="undo" onClick={b.loadAll}>ลองใหม่</Btn>}
        {b.load === 'ok' && n > 0 && (
          <>
            <Btn kind="primary" h={116} fs={33} icon="sun" onClick={() => b.goToday(0)}>
              {b.streak.visitedToday ? 'ดูรูปวันนี้อีกครั้ง' : 'ดูรูปวันนี้'}
            </Btn>
            <Btn kind="secondary" h={92} fs={29} icon="camera" onClick={b.startAdd}>เพิ่มรูปใหม่</Btn>
            <Btn kind="ghost" h={60} fs={24} icon="album" onClick={() => b.go('albums')}>ดูรูปทั้งหมด {n} รูป</Btn>
          </>
        )}
        {b.load === 'ok' && n === 0 && <Btn kind="primary" h={130} fs={34} icon="camera" onClick={b.startAdd}>เพิ่มรูปแรก</Btn>}
      </div>
    </div>
  );
}

function Choice({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return <Btn kind={on ? 'primary' : 'secondary'} pressed={on} h={72} fs={26} icon={on ? 'check' : undefined} onClick={onClick}>{label}</Btn>;
}

export function Settings() {
  const b = useBook();
  const s = b.settings;
  return (
    <div className="mb-screen mb-pad" style={{ gap: 26 }}>
      <Say text={SAY.settings}><H1 fs={42}>ตั้งค่า</H1></Say>

      <section className="mb-card mb-section">
        <Sub fs={24}>ขนาดตัวหนังสือ</Sub>
        <TextSizePicker />
      </section>

      <section className="mb-card mb-section">
        <Sub fs={24}>สีของสมุด</Sub>
        <div className="mb-grid2">
          <Choice on={s.theme === 'light'} label="พื้นสว่าง" onClick={() => b.updateSettings({ theme: 'light' })} />
          <Choice on={s.theme === 'dark'} label="พื้นเข้ม" onClick={() => b.updateSettings({ theme: 'dark' })} />
        </div>
      </section>

      <section className="mb-card mb-section">
        <Sub fs={24}>อ่านหัวข้อให้ฟังเอง</Sub>
        <div className="mb-grid2">
          <Choice on={s.autoSpeak} label="เปิด" onClick={() => { b.updateSettings({ autoSpeak: true }); b.say('เปิดเสียงอ่านแล้วค่ะ', true); }} />
          <Choice on={!s.autoSpeak} label="ปิด" onClick={() => b.updateSettings({ autoSpeak: false })} />
        </div>
      </section>

      <section className="mb-card mb-section">
        <Sub fs={24}>ความเร็วเสียงอ่าน</Sub>
        <div className="mb-grid2">
          <Choice on={s.speechRate === 'slow'} label="ช้า" onClick={() => { b.updateSettings({ speechRate: 'slow' }); speak('อ่านช้าแบบนี้นะคะ', RATE.slow); }} />
          <Choice on={s.speechRate === 'normal'} label="ปกติ" onClick={() => { b.updateSettings({ speechRate: 'normal' }); speak('อ่านแบบนี้นะคะ', RATE.normal); }} />
        </div>
      </section>

      {lineLoggedIn() && (
        <section className="mb-card mb-section">
          <Sub fs={24}>ข้อความทักทายตอนเช้าใน LINE</Sub>
          <Sub fs={19} style={{ opacity: 0.75 }}>ส่งตอนเจ็ดโมงเช้า ถ้าวันนั้นยังไม่ได้ดูรูป</Sub>
          <div className="mb-grid2">
            <Choice on={s.morningGreeting} label="เปิด" onClick={() => { b.updateSettings({ morningGreeting: true }); b.say('พรุ่งนี้เช้าจะส่งข้อความทักทายไปใน LINE ค่ะ'); }} />
            <Choice on={!s.morningGreeting} label="ปิด" onClick={() => { b.updateSettings({ morningGreeting: false }); b.say('ปิดข้อความตอนเช้าแล้วค่ะ'); }} />
          </div>
        </section>
      )}

      <section className="mb-card mb-section">
        <Sub fs={24}>ให้เรียกว่า</Sub>
        <Btn kind="secondary" h={72} fs={26} icon="pencil" onClick={() => b.go('nickname')}>{b.nickname ?? 'ยังไม่ได้เลือก'} · เปลี่ยน</Btn>
      </section>

      <Btn kind="primary" h={100} fs={30} icon="check" onClick={() => b.go('home', b.homeSay())}>เสร็จแล้ว กลับหน้าแรก</Btn>
    </div>
  );
}
