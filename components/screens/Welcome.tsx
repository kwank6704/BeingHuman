'use client';

import type { CSSProperties } from 'react';
import { SCALE, type TextSize } from '@/lib/settings';
import { useBook } from '../book';
import { NICKNAMES, SAY } from '../useBookState';
import { Btn, H1, Say, Sub, px } from '../ui';

export function Welcome() {
  const b = useBook();
  return (
    <div className="mb-screen mb-pad">
      <Say text={SAY.welcome} className="mb-grow" style={{ gap: 12 }}>
        <div className="mb-kicker">สมุดความทรงจำ</div>
        <H1 fs={46}>สวัสดีค่ะ<br />ยินดีต้อนรับ</H1>
        <Sub fs={25}>สมุดนี้เก็บรูปคนที่รัก พร้อมเสียงเล่าเรื่องของคุณเอง</Sub>
        <ol className="mb-steps">
          <li><b>1</b>ถ่ายรูปคนที่รัก</li>
          <li><b>2</b>เล่าเรื่องให้ฟัง</li>
          <li><b>3</b>เปิดดูทุกวัน</li>
        </ol>
      </Say>
      <Btn kind="primary" h={124} fs={33} onClick={() => b.go('nickname')}>เริ่มเลย ›</Btn>
    </div>
  );
}

export function Nickname() {
  const b = useBook();
  return (
    <div className="mb-screen mb-pad">
      <Say text={SAY.nickname} className="mb-grow" style={{ gap: 8 }}>
        <H1 fs={40}>อยากให้เรียกว่าอะไรดีคะ</H1>
        <Sub fs={23}>จะใช้ทักทายทุกครั้งที่เปิดสมุด</Sub>
      </Say>
      <div className="mb-grid2">
        {NICKNAMES.map(n => (
          <Btn key={n} kind={n === b.nickname ? 'primary' : 'secondary'} pressed={n === b.nickname} h={88} fs={30} onClick={() => b.chooseNickname(n)}>{n}</Btn>
        ))}
      </div>
      <Btn kind="ghost" h={64} fs={23} onClick={() => b.chooseNickname(null)}>ไม่ต้องเรียก ข้ามไป ›</Btn>
    </div>
  );
}

const SIZES: { size: TextSize; label: string }[] = [
  { size: 'normal', label: 'ปกติ' },
  { size: 'large', label: 'ใหญ่' },
  { size: 'xlarge', label: 'ใหญ่มาก' },
];

/** Each choice is drawn at its own size, so the elder picks what they can read. */
export function TextSizePicker() {
  const b = useBook();
  return (
    <div className="mb-stack">
      {SIZES.map(({ size, label }) => {
        const on = b.settings.textSize === size;
        return (
          <button
            key={size}
            type="button"
            aria-pressed={on}
            onClick={() => b.chooseTextSize(size)}
            className={`btn btn-${on ? 'primary' : 'secondary'} mb-btn mb-size`}
            style={{ '--k': SCALE[size] } as CSSProperties}
          >
            <span style={{ fontSize: px(28) }}>{on ? '✓ ' : ''}อ่านง่ายไหมคะ</span>
            <span style={{ fontSize: px(18), fontWeight: 500 }}>ตัวหนังสือ{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TextSizeScreen() {
  return (
    <div className="mb-screen mb-pad">
      <Say text={SAY.textSize} className="mb-grow" style={{ gap: 8 }}>
        <H1 fs={38}>ตัวหนังสือขนาดไหน อ่านง่ายที่สุดคะ</H1>
        <Sub fs={22}>กดเลือกได้เลย เปลี่ยนทีหลังได้ที่ “ตั้งค่า”</Sub>
      </Say>
      <TextSizePicker />
    </div>
  );
}
