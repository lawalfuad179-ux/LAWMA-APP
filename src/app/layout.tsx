import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { ToastProvider } from '@/context/ToastContext';
import { InstallPrompt } from '@/components/ui/InstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LAWMA - Lagos Waste Management',
  description: 'Waste collection schedules, bill payments, and complaint reporting for Lagos residents.',
  icons: { icon: '/favicon.png', shortcut: '/favicon.png', apple: '/favicon.png' },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LAWMA',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1010' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>
        <ToastProvider>
          {children}
          <InstallPrompt />
        </ToastProvider>
      </body>
    </html>
  );
}
