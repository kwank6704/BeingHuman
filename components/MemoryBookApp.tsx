'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { SCALE } from '@/lib/settings';
import { BookContext, useBook } from './book';
import { useBookState, type Screen } from './useBookState';
import { AddPhoto, Browse, Home, Today, Welcome } from './screens';

const SCREENS: Record<Screen, () => React.ReactNode> = {
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
  if (!mounted) return <div className="mb-root" />;
  return <Book />;
}

function Book() {
  const book = useBookState();
  const Current = SCREENS[book.scr];
  return (
    <BookContext.Provider value={book}>
      <div className="blueprint mb-root" style={{ '--k': SCALE[book.settings.textSize] } as CSSProperties}>
        <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
        {book.showBack && (
          <button type="button" onClick={book.back} className="btn btn-ghost mb-btn mb-back">‹ {book.backLabel}</button>
        )}
        <Current key={book.scr} />
        <ToastBar />
        {book.busy && <div className="mb-busy" role="status">{book.busy}</div>}
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
      <span>{toast.text}</span>
      {toast.undo && <button type="button" className="mb-toast-undo" onClick={toast.undo}>เอาคืน</button>}
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
      <button type="button" className="btn btn-primary mb-btn" onClick={() => setZoom(null)}>✕  ปิดรูปใหญ่</button>
    </div>
  );
}
