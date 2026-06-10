import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/lib/fontawesome';
import AgasthiyanWidget from '@/components/agasthiyan/AgasthiyanWidget';

export const metadata: Metadata = {
  title: 'வைத்தியம் | Vaithiyam — Traditional Medicine',
  description: 'Authentic Siddha, Ayurveda & Natural products — வைத்தியம்',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path fill='%233D8A5C' d='M50 5C27 5 10 25 10 50c0 15 7 28 18 37 3-12 9-22 18-29-6 10-9 21-9 33h6c0-10 3-19 7-27 4 8 7 17 7 27h6c0-12-3-23-9-33 9 7 15 17 18 29 11-9 18-22 18-37C90 25 73 5 50 5z'/></svg>" },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#030C07',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ta" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,600&family=Outfit:wght@300;400;500;600;700&family=Noto+Serif+Tamil:wght@300;400;600;700&family=Catamaran:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <AgasthiyanWidget />
      </body>
    </html>
  );
}
