'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ChapterLink } from '@/types/komiku';

interface ChapterAccordionProps {
  chapters: ChapterLink[];
  defaultOpen?: boolean;
}

export function ChapterAccordion({
  chapters,
  defaultOpen,
}: ChapterAccordionProps) {
  const shouldOpenDefault = defaultOpen ?? chapters.length <= 10;
  const [open, setOpen] = useState(shouldOpenDefault);

  return (
    <div className="accordion" data-open={open}>
      <button
        type="button"
        className="accordion-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="accordion-trigger-label">
          Daftar chapter
          <span className="accordion-trigger-count">
            ({chapters.length})
          </span>
        </span>
        <ChevronIcon />
      </button>

      <div className="accordion-content">
        <ul className="chapter-list">
          {chapters.map((ch) => (
            <li key={ch.slug}>
              <Link href={`/baca/${ch.slug}`} className="chapter-item">
                <span className="chapter-radio" aria-hidden="true" />
                <span className="chapter-title">{ch.title}</span>
                {ch.date && <span className="chapter-date">{ch.date}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="accordion-chevron"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}