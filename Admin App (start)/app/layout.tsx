import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppShell } from './components/AppShell';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'LAWMA Admin — Control Center',
  description: 'Operational dashboard for LAWMA control-center staff. Live pickup tracking, complaints management, resident billing oversight.',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
