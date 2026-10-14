import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScrollToTop } from '@/components/scroll-to-top';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kuroneko — Komik Online Bahasa Indonesia',
    template: '%s · Kuroneko',
  },
  description:
    'Baca manga, manhwa, dan manhua bahasa Indonesia. Update tiap hari, gratis.',
  keywords: [
    'komik online',
    'baca komik',
    'komik bahasa indonesia',
    'manga',
    'manhwa',
    'manhua',
    'komik gratis',
    'komik update',
  ],
  authors: [{ name: 'Fahmi Coenubia' }],
  creator: 'Fahmi Coenubia',
  icons: {
    icon: '/kuroneko-logo.png',
    apple: '/kuroneko-logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Kuroneko',
    title: 'Kuroneko — Komik Online Bahasa Indonesia',
    description:
      'Baca manga, manhwa, dan manhua bahasa Indonesia. Update tiap hari, gratis.',
    images: [
      {
        url: '/kuroneko-logo.png',
        width: 1254,
        height: 1254,
        alt: 'Kuroneko',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kuroneko — Komik Online Bahasa Indonesia',
    description:
      'Baca manga, manhwa, dan manhua bahasa Indonesia. Update tiap hari, gratis.',
    images: ['/kuroneko-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('kuroneko-theme');
                  var theme = stored;
                  if (!theme || theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Suspense fallback={<NavbarSkeleton />}>
            <Navbar />
          </Suspense>
          <div className="site-content">{children}</div>
          <Footer />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}

function NavbarSkeleton() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div
          className="skeleton"
          style={{ height: '28px', width: '120px' }}
        />
      </div>
    </header>
  );
}
