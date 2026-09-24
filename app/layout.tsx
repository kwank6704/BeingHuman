import type { Metadata, Viewport } from 'next';
import { Anuphan, IBM_Plex_Sans_Thai } from 'next/font/google';
import './industry.css';
import './globals.css';

const anuphan = Anuphan({ subsets: ['thai', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-anuphan' });
const plex = IBM_Plex_Sans_Thai({ subsets: ['thai', 'latin'], weight: ['400', '500', '600'], variable: '--font-plex' });

export const metadata: Metadata = {
  title: 'สมุดความทรงจำ',
  description: 'เก็บรูปคนที่รัก พร้อมเสียงเล่าเรื่อง',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f2f2f3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${anuphan.variable} ${plex.variable}`}>
      <body>{children}</body>
    </html>
  );
}
