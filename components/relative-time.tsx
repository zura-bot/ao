'use client';

import { useEffect, useState } from 'react';

interface RelativeTimeProps {
  timestamp: number;
  className?: string;
  prefix?: string;
}

export function RelativeTime({
  timestamp,
  className,
  prefix = '',
}: RelativeTimeProps) {
  const [text, setText] = useState('');

  useEffect(() => {
    const format = () => {
      const now = Date.now();
      const diff = now - timestamp;
      const sec = Math.floor(diff / 1000);
      const min = Math.floor(sec / 60);
      const hr = Math.floor(min / 60);
      const day = Math.floor(hr / 24);

      let rel: string;
      if (sec < 60) rel = 'baru aja';
      else if (min < 60) rel = `${min} menit lalu`;
      else if (hr < 24) rel = `${hr} jam lalu`;
      else if (day < 7) rel = `${day} hari lalu`;
      else if (day < 30) rel = `${Math.floor(day / 7)} minggu lalu`;
      else if (day < 365) rel = `${Math.floor(day / 30)} bulan lalu`;
      else rel = `${Math.floor(day / 365)} tahun lalu`;

      setText(prefix + rel);
    };

    format();
    const timer = setInterval(format, 60000);
    return () => clearInterval(timer);
  }, [timestamp, prefix]);

  if (!text) return null;
  return <span className={className}>{text}</span>;
}
