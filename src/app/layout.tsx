import type { Metadata, Viewport } from 'next';
import Providers from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Verse',
  description: 'A next-generation Bible study app.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-gold/30">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
