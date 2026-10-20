import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Fraunces, Inter } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google'; // <-- Import GA
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ScrollToTop } from '@/components/scroll-to-top';
import { WelcomeModal } from '@/components/welcome-modal';
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

const siteTitle = 'Kuroneko — Komik Online Bahasa Indonesia';

// Meta description (pas 160 karakter buat Google)
const siteDescription =
  'Kuroneko adalah situs baca komik online (manga, manhwa, manhua) berbahasa Indonesia. Dibuat oleh Fahmi Coenubia, praktis dan gratis.';

// OG/Twitter description (bisa lebih panjang buat share preview)
const siteDescriptionLong =
  'Kuroneko adalah situs baca komik online (manga, manhwa, manhua) berbahasa Indonesia. Dikembangkan oleh Fahmi Coenubia untuk pengalaman membaca yang praktis.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: '%s · Kuroneko',
  },
  description: siteDescription,
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
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Kuroneko',
    title: siteTitle,
    description: siteDescriptionLong,
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
    title: siteTitle,
    description: siteDescriptionLong,
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
          <WelcomeModal /> 
        </ThemeProvider>
        
        {/* GOOGLE ANALYTICS DI SINI */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
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