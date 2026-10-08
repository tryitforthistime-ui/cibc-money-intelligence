import type { ISODate } from './types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_MS = 86_400_000;

function parts(iso: ISODate): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

/** Calendar math in UTC so results never depend on the device time zone. */
function toUTC(iso: ISODate): number {
  const { year, month, day } = parts(iso);
  return Date.UTC(year, month - 1, day);
}

function fromUTC(ms: number): ISODate {
  const d = new Date(ms);
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromUTC(toUTC(iso) + days * DAY_MS);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

export function weekdayIndex(iso: ISODate): number {
  return new Date(toUTC(iso)).getUTCDay();
}

export type DateStyle =
  | 'long' // October 15
  | 'short' // Oct 15
  | 'weekdayShort' // Thu, Oct 15
  | 'weekdayLong' // Thursday, October 15
  | 'chip'; // Thu 15

export function formatDate(iso: ISODate, style: DateStyle = 'short'): string {
  const { month, day } = parts(iso);
  const monthName = MONTHS[month - 1];
  const weekday = WEEKDAYS[weekdayIndex(iso)];
  switch (style) {
    case 'long':
      return `${monthName} ${day}`;
    case 'short':
      return `${monthName.slice(0, 3)} ${day}`;
    case 'weekdayShort':
      return `${weekday.slice(0, 3)}, ${monthName.slice(0, 3)} ${day}`;
    case 'weekdayLong':
      return `${weekday}, ${monthName} ${day}`;
    case 'chip':
      return `${weekday.slice(0, 3)} ${day}`;
  }
}

/** "Today", "Tomorrow" or "Thu, Oct 15" relative to the demo date. */
export function formatRelativeDay(iso: ISODate, today: ISODate): string {
  const diff = daysBetween(today, iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return formatDate(iso, 'weekdayShort');
}
