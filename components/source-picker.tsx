'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getSourceClient,
  setSourceClient,
  SOURCE_INFO,
} from '@/lib/source-cookie-client';
import type { SourceId } from '@/lib/sources/types';

export function SourcePicker() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [current, setCurrent] = useState<SourceId>('komiku');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrent(getSourceClient());
  }, []);

  const handleSelect = (source: SourceId) => {
    setSourceClient(source);
    setCurrent(source);
    setOpen(false);
    router.refresh();
    // Full reload biar server component re-render dengan cookie baru
    setTimeout(() => window.location.reload(), 100);
  };

  if (!mounted) {
    return (
      <button className="icon-btn" disabled aria-label="Pilih server">
        <ServerIcon />
      </button>
    );
  }

  return (
    <div className="source-picker">
      <button
        type="button"
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Server: ${SOURCE_INFO[current].short}`}
        title={SOURCE_INFO[current].name}
      >
        <ServerIcon />
      </button>

      {open && (
        <>
          <div
            className="source-picker-backdrop"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="source-picker-menu" role="menu">
            <div className="source-picker-label">Pilih server</div>
            {(['komiku', 'shinigami'] as SourceId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`source-picker-item ${current === id ? 'is-active' : ''}`}
                onClick={() => handleSelect(id)}
                role="menuitem"
              >
                <span className="source-picker-item-name">
                  {SOURCE_INFO[id].name}
                </span>
                {current === id && (
                  <span className="source-picker-item-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ServerIcon() {
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
      <rect x="2" y="3" width="20" height="6" rx="2" />
      <rect x="2" y="15" width="20" height="6" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
