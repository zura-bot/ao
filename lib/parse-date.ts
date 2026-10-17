const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, agustus: 7, aug: 7, august: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, oct: 9, october: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11, december: 11,
};

export function parseDate(input: string | null | undefined): number | undefined {
  if (!input || typeof input !== 'string') return undefined;
  const str = input.trim();
  if (!str) return undefined;

  // 1. Coba ISO / native parse dulu
  const nativeTs = Date.parse(str);
  if (!isNaN(nativeTs)) return nativeTs;

  // 2. Format Indonesia: "18 Aug 2026"
  const match = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const monthStr = match[2].toLowerCase().slice(0, 3);
    const year = Number(match[3]);
    const month = MONTHS[monthStr];
    if (month !== undefined && day >= 1 && day <= 31) {
      return new Date(year, month, day).getTime();
    }
  }

  // 3. Format: "2026-10-16" (date only)
  const dateOnlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    return new Date(Number(y), Number(m) - 1, Number(d)).getTime();
  }

  return undefined;
}

/**
 * Format tanggal jadi rapi: "17 Okt 2026" atau "17 Okt"
 * Bisa handle ISO string atau string tanggal Indonesia.
 */
export function formatDateShort(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  const str = input.trim();
  if (!str) return '';

  const ts = parseDate(str);
  if (!ts) return str;

  const d = new Date(ts);
  const day = d.getDate();
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}
