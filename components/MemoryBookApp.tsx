'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { SCALE } from '@/lib/settings';
import { Icon, Spinner } from './art';
import { BookContext, useBook } from './book';
import { LoadingScreen } from './Loading';
import { useBookState, type Screen } from './useBookState';
import { AddPhoto, Browse, Home, Today, Welcome } from './screens';

const SCREENS: Record<Screen, () => React.ReactNode> = {
  sound: Welcome.Sound,
  welcome: Welcome.Welcome,
  nickname: Welcome.Nickname,
  textSize: Welcome.TextSizeScreen,
  home: Home.Home,
  settings: Home.Settings,
  shoot: AddPhoto.Shoot,
  who: AddPhoto.Who,
  name: AddPhoto.Name,
  tell: AddPhoto.Tell,
  saved: AddPhoto.Saved,
  today: Today.Today,
  todayDone: Today.TodayDone,
  albums: Browse.Albums,
  view: Browse.View,
  more: Browse.More,
  confirmDelete: Browse.ConfirmDelete,
  slideshow: Browse.Slideshow,
};

export default function MemoryBookApp() {
  // Greeting, date and settings depend on this device, so render only in the browser.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="mb-root"><LoadingScreen /></div>;
  return <Book />;
}

function Book() {
  const book = useBookState();
  const Current = SCREENS[book.scr];
  return (
    <BookContext.Provider value={book}>
      <div className="mb-root" style={{ '--k': SCALE[book.settings.textSize] } as CSSProperties}>
        {book.showBack && (
          <div className="mb-topbar">
            <button type="button" onClick={book.back} className="mb-back"><Icon name="left" /> {book.backLabel}</button>
          </div>
        )}
        <Current key={book.scr} />
        <ToastBar />
        {book.busy && <div className="mb-busy" role="status"><div className="mb-busy-card"><Spinner />{book.busy}</div></div>}
        <Zoom />
      </div>
    </BookContext.Provider>
  );
}

/** Sits at the bottom of the screen (not over it), so it never hides a button. */
function ToastBar() {
  const { toast } = useBook();
  if (!toast) return null;
  return (
    <div className="mb-toast" role="status">
      <Icon name={toast.undo ? 'trash' : 'check'} />
      <span>{toast.text}</span>
      {toast.undo && <button type="button" className="mb-toast-undo" onClick={toast.undo}><Icon name="undo" /> เอาคืน</button>}
    </div>
  );
}

function Zoom() {
  const { zoom, setZoom } = useBook();
  if (!zoom) return null;
  return (
    <div className="mb-zoom" role="dialog" aria-label="รูปเต็มจอ">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={zoom} alt="" onClick={() => setZoom(null)} />
      <button type="button" className="btn btn-primary mb-btn" onClick={() => setZoom(null)}><Icon name="close" /> ปิดรูปใหญ่</button>
    </div>
  );
}
