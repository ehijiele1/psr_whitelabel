import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import PushNotificationInit from '@/components/ui/PushNotificationInit';

export const metadata: Metadata = {
  title: 'PrinceSteve Residence',
  description: 'Property Management System — Lagos, Nigeria',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PSR',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F172A',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ThemeProvider>
          {children}
          <PushNotificationInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
