/**
 * "กำลังเปิดสมุด…": shown before the app has started and while the book loads (or while LINE
 * logs in). It uses no app state, so the very first paint from the server looks the same.
 */
export function LoadingScreen() {
  return (
    <div className="mb-loading" role="status" aria-live="polite">
      <svg className="mb-loading-book" viewBox="0 0 220 150" aria-hidden>
        <ellipse cx="110" cy="138" rx="86" ry="8" fill="rgba(20,60,110,.12)" />
        {/* left and right pages */}
        <path d="M110 30 C 84 20, 44 20, 18 28 V 124 C 44 116, 84 116, 110 126 Z" fill="#F7FBFF" stroke="#C9DCEE" strokeWidth="2" />
        <path d="M110 30 C 136 20, 176 20, 202 28 V 124 C 176 116, 136 116, 110 126 Z" fill="#FFFFFF" stroke="#C9DCEE" strokeWidth="2" />
        <g stroke="#D6E6F5" strokeWidth="3" strokeLinecap="round">
          <path d="M34 50 H 92M34 64 H 86M34 78 H 92M34 92 H 76" />
          <path d="M128 50 H 186M128 64 H 180M128 78 H 186M128 92 H 170" />
        </g>
        {/* the page that keeps turning */}
        <path className="mb-flip" d="M110 30 C 136 20, 176 20, 202 28 V 124 C 176 116, 136 116, 110 126 Z" stroke="#9CC4E8" strokeWidth="2" />
        <path d="M110 30 V126" stroke="#B5CFE8" strokeWidth="2" />
        <rect x="160" y="10" width="12" height="34" rx="2" fill="#2F7FC8" />
        {/* hearts rising from the book */}
        <path className="mb-rise" style={{ animationDelay: '0s' }} d="M70 18 c-5-4-6-7-4-9 2-2 4-1 4 1 0-2 2-3 4-1 2 2 1 5-4 9z" fill="#F28FB0" />
        <path className="mb-rise" style={{ animationDelay: '1.1s' }} d="M150 14 c-5-4-6-7-4-9 2-2 4-1 4 1 0-2 2-3 4-1 2 2 1 5-4 9z" fill="#5FA8EE" />
        <path className="mb-rise" style={{ animationDelay: '2.2s' }} d="M112 10 c-5-4-6-7-4-9 2-2 4-1 4 1 0-2 2-3 4-1 2 2 1 5-4 9z" fill="#FFD36B" />
      </svg>
      <div className="mb-loading-kicker">สมุดความทรงจำ</div>
      <div className="mb-loading-text">กำลังเปิดสมุด<span className="mb-loading-dots"><i>.</i><i>.</i><i>.</i></span></div>
    </div>
  );
}
