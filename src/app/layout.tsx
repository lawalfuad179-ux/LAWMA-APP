import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LAWMA - Lagos Waste Management',
  description: 'Waste collection schedules, bill payments, and complaint reporting for Lagos residents.',
  icons: [{ rel: 'icon', url: '/favicon.png', type: 'image/png' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
