'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './theme-provider';

export function ThemeToggle() {
  const themeCtx = useTheme();
  const [mounted, setMounted] = useState(false);

  const theme = themeCtx?.theme ?? 'light';
  const toggle = themeCtx?.toggle ?? (() => {});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sebelum mount, render placeholder (ukuran sama, biar nggak ada layout shift)
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Ganti tema"
        title="Ganti tema"
        className="icon-btn"
        disabled
      >
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 18,
            height: 18,
          }}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
      title={`Ganti ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
      className="icon-btn"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
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
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}