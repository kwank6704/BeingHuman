'use client';

import { bg, greeting, thToday } from '@/lib/media';
import { RATE } from '@/lib/settings';
import { speak } from '@/lib/speech';
import { useBook } from '../book';
import { SAY } from '../useBookState';
import { Btn, H1, Say, Sub } from '../ui';
import { TextSizePicker } from './Welcome';

export function Home() {
  const b = useBook();
  const n = b.mems.length;
  const recent = b.mems.slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, 3);
  const status =
    b.load === 'loading' ? 'กำลังเปิดสมุด…'
    : b.load === 'error' ? 'ตอนนี้เปิดสมุดไม่ได้ ลองใหม่อีกครั้งนะคะ'
    : n ? 'มีรูปเก็บไว้ ' + n + ' รูป' : 'ยังไม่มีรูปเลย มาเริ่มเก็บรูปแรกกันค่ะ';

  return (
    <div className="mb-screen mb-pad">
      <div className="mb-top">
        <div className="mb-kicker">{thToday()}</div>
        {b.load === 'ok' && (
          <button type="button" className="btn btn-secondary mb-btn mb-gear" onClick={() => b.go('settings')}>⚙ ตั้งค่า</button>
        )}
      </div>
      <div className="mb-grow" style={{ gap: 12 }}>
        <Say text={b.load === 'ok' ? b.homeSay() : status} style={{ gap: 4 }}>
          <H1 fs={44}>{greeting()}</H1>
          {b.nickname && <H1 fs={38} style={{ color: 'var(--color-accent-700)' }}>{b.nickname}</H1>}
          <Sub fs={26} style={{ marginTop: 6 }}>{status}</Sub>
        </Say>
        {b.streak.streak > 0 && (
          <div className="mb-streak">✿ ดูรูปมาแล้ว {b.streak.streak} วันติดกัน</div>
        )}
        {n > 0 && (
          <div className="mb-thumbs">
            {recent.map(m => <div key={m.id} className="mb-thumb" style={bg(m.imageUrl)} />)}
          </div>
        )}
      </div>
      {b.load === 'error' && <Btn kind="primary" h={124} fs={33} onClick={b.loadAll}>ลองใหม่</Btn>}
      {b.load === 'ok' && n > 0 && (
        <>
          <Btn kind="primary" h={124} fs={33} onClick={() => b.goToday(0)}>
            {b.streak.visitedToday ? 'ดูรูปวันนี้อีกครั้ง' : 'ดูรูปวันนี้'}
          </Btn>
          <Btn kind="secondary" h={100} fs={30} onClick={b.startAdd}>+ เพิ่มรูปใหม่</Btn>
          <Btn kind="ghost" h={64} fs={24} onClick={() => b.go('albums')}>ดูรูปทั้งหมด {n} รูป ›</Btn>
        </>
      )}
      {b.load === 'ok' && n === 0 && <Btn kind="primary" h={140} fs={34} onClick={b.startAdd}>+ เพิ่มรูปแรก</Btn>}
    </div>
  );
}

function Choice({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return <Btn kind={on ? 'primary' : 'secondary'} pressed={on} h={76} fs={26} onClick={onClick}>{on ? '✓ ' : ''}{label}</Btn>;
}

export function Settings() {
  const b = useBook();
  const s = b.settings;
  return (
    <div className="mb-screen mb-pad" style={{ gap: 26 }}>
      <Say text={SAY.settings}><H1 fs={42}>ตั้งค่า</H1></Say>

      <section className="mb-section">
        <Sub fs={24}>ขนาดตัวหนังสือ</Sub>
        <TextSizePicker />
      </section>

      <section className="mb-section">
        <Sub fs={24}>สีของสมุด</Sub>
        <div className="mb-grid2">
          <Choice on={s.theme === 'light'} label="พื้นสว่าง" onClick={() => b.updateSettings({ theme: 'light' })} />
          <Choice on={s.theme === 'dark'} label="พื้นเข้ม" onClick={() => b.updateSettings({ theme: 'dark' })} />
        </div>
      </section>

      <section className="mb-section">
        <Sub fs={24}>อ่านหัวข้อให้ฟังเอง</Sub>
        <div className="mb-grid2">
          <Choice on={s.autoSpeak} label="เปิด" onClick={() => { b.updateSettings({ autoSpeak: true }); b.say('เปิดเสียงอ่านแล้วค่ะ', true); }} />
          <Choice on={!s.autoSpeak} label="ปิด" onClick={() => b.updateSettings({ autoSpeak: false })} />
        </div>
      </section>

      <section className="mb-section">
        <Sub fs={24}>ความเร็วเสียงอ่าน</Sub>
        <div className="mb-grid2">
          <Choice on={s.speechRate === 'slow'} label="ช้า" onClick={() => { b.updateSettings({ speechRate: 'slow' }); speak('อ่านช้าแบบนี้นะคะ', RATE.slow); }} />
          <Choice on={s.speechRate === 'normal'} label="ปกติ" onClick={() => { b.updateSettings({ speechRate: 'normal' }); speak('อ่านแบบนี้นะคะ', RATE.normal); }} />
        </div>
      </section>

      <section className="mb-section">
        <Sub fs={24}>ให้เรียกว่า</Sub>
        <Btn kind="secondary" h={76} fs={26} onClick={() => b.go('nickname')}>{b.nickname ?? 'ยังไม่ได้เลือก'} · เปลี่ยน ›</Btn>
      </section>

      <Btn kind="primary" h={100} fs={30} onClick={() => b.go('home', b.homeSay())}>เสร็จแล้ว กลับหน้าแรก</Btn>
    </div>
  );
}
