// Periods of the sales report in the browser's time zone; `to` is exclusive. Pure.

export const REPORT_PERIODS = [
  'today',
  'yesterday',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'custom',
] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const pad = (value: number) => String(value).padStart(2, '0');

/** Value for an <input type="date">, in local time. */
export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** An <input type="date"> value as the start of that day in local time; null when invalid. */
export const fromDateInputValue = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value?.trim() || '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
};

/**
 * The period to report: the preset relative to now, or the custom days (both inclusive). Null when
 * the custom days are missing or in the wrong order.
 */
export function reportPeriod(
  period: ReportPeriod,
  now = new Date(),
  custom: { fromDay?: string; toDay?: string } = {},
): { from: Date; to: Date } | null {
  const today = startOfDay(now);
  switch (period) {
    case 'today':
      return { from: today, to: addDays(today, 1) };
    case 'yesterday':
      return { from: addDays(today, -1), to: today };
    case 'thisMonth':
      return {
        from: new Date(today.getFullYear(), today.getMonth(), 1),
        to: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      };
    case 'lastMonth':
      return {
        from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        to: new Date(today.getFullYear(), today.getMonth(), 1),
      };
    case 'thisYear':
      return { from: new Date(today.getFullYear(), 0, 1), to: new Date(today.getFullYear() + 1, 0, 1) };
    default: {
      const from = fromDateInputValue(custom.fromDay || '');
      const lastDay = fromDateInputValue(custom.toDay || '');
      if (!from || !lastDay || lastDay < from) return null;
      return { from, to: addDays(lastDay, 1) };
    }
  }
}
