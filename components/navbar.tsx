'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect, type FormEvent } from 'react';
import { ThemeToggle } from './theme-toggle';

const NAV_LINKS = [
  { href: '/latest', label: 'Baru masuk' },
  { href: '/popular', label: 'Sering dibaca' },
  { href: '/genre', label: 'Genre' },
  { href: '/riwayat', label: 'Riwayat' },
];

const TYPE_LINKS = [
  { href: '/type/manga', label: 'Manga' },
  { href: '/type/manhwa', label: 'Manhwa' },
  { href: '/type/manhua', label: 'Manhua' },
];

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="/kuroneko-logo.png"
            alt="Kuroneko"
            style={{
              height: '28px',
              width: 'auto',
              maxWidth: '120px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Link>

        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>

        <Suspense fallback={<SearchBarFallback />}>
          <SearchSection />
        </Suspense>

        <div className="navbar-actions">
          <Link
            href="/search"
            className="icon-btn navbar-search-link"
            aria-label="Cari komik"
          >
            <SearchIcon />
          </Link>
          <Suspense fallback={null}>
            <MobileMenuButton />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>

      <Suspense fallback={null}>
        <MobileMenu />
      </Suspense>
    </header>
  );
}

function NavLinks() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="navbar-links" aria-label="Menu utama">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`navbar-link ${isActive(link.href) ? 'is-active' : ''}`}
        >
          {link.label}
        </Link>
      ))}

      <span className="navbar-divider" aria-hidden="true" />

      {TYPE_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`navbar-link navbar-link-type ${
            isActive(link.href) ? 'is-active' : ''
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function NavLinksFallback() {
  return <div className="flex-1" />;
}

function SearchSection() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const isHome = pathname === '/';
  const isSearch = pathname === '/search';

  if (isHome || isSearch) {
    return <div className="flex-1 navbar-spacer" />;
  }

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSearch} className="search-bar navbar-search-desktop">
      <SearchIcon />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari komik..."
        aria-label="Cari komik"
      />
    </form>
  );
}

function SearchBarFallback() {
  return <div className="flex-1" />;
}

function MobileMenuButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const event = new CustomEvent('kuroneko:menu', { detail: open });
    window.dispatchEvent(event);
  }, [open]);

  return (
    <button
      type="button"
      className="icon-btn navbar-menu-btn"
      onClick={() => setOpen((v) => !v)}
      aria-label="Menu"
      aria-expanded={open}
    >
      <MenuIcon open={open} />
    </button>
  );
}

function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setOpen(Boolean(detail));
    };
    window.addEventListener('kuroneko:menu', handler);
    return () => window.removeEventListener('kuroneko:menu', handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!open) return null;

  return (
    <nav className="navbar-mobile-menu" aria-label="Menu mobile">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="navbar-mobile-link"
          onClick={() => setOpen(false)}
        >
          {link.label}
        </Link>
      ))}

      <div className="navbar-mobile-divider" />

      <p className="navbar-mobile-label">Tipe</p>
      <div className="navbar-mobile-types">
        {TYPE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="navbar-mobile-type"
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
