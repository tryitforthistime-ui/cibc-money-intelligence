import type { Cents } from './types';

/** Typographic minus sign used for all negative amounts. */
export const MINUS = '−';

export function dollars(amount: number): Cents {
  return Math.round(amount * 100);
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export interface FormatMoneyOptions {
  /** "always" → $1,080.00, "auto" → $1,080 / $19.99, "never" → $1,080 (rounded). */
  decimals?: 'always' | 'auto' | 'never';
  /** "negative" → only negatives get a sign, "always" → +$ / −$, "never" → no sign. */
  sign?: 'negative' | 'always' | 'never';
}

export function formatMoney(cents: Cents, options: FormatMoneyOptions = {}): string {
  const { decimals = 'always', sign = 'negative' } = options;
  const rounded = Math.round(cents);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);

  let body: string;
  if (decimals === 'never') {
    body = '$' + groupThousands(String(Math.round(abs / 100)));
  } else {
    const whole = Math.floor(abs / 100);
    const fraction = abs % 100;
    body = '$' + groupThousands(String(whole));
    if (decimals === 'always' || fraction !== 0) {
      body += '.' + String(fraction).padStart(2, '0');
    }
  }

  if (negative && sign !== 'never') return MINUS + body;
  if (!negative && sign === 'always' && rounded !== 0) return '+' + body;
  return body;
}

/** Formats an always-positive amount with the sign implied by its direction. */
export function formatDirectional(
  amount: Cents,
  direction: 'income' | 'expense',
  decimals: FormatMoneyOptions['decimals'] = 'always',
): string {
  const body = formatMoney(Math.abs(amount), { decimals, sign: 'never' });
  return (direction === 'expense' ? MINUS : '+') + body;
}

/** Keeps only what a currency field may contain: digits and one dot with 2 decimals. */
export function sanitizeMoneyInput(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = cleaned.split('.');
  const intPart = whole.replace(/^0+(?=\d)/, '').slice(0, 7);
  if (rest.length === 0) return intPart;
  return `${intPart || '0'}.${rest.join('').slice(0, 2)}`;
}

/** Parses user input like "200", "$1,080.5" into cents. Returns null when empty or invalid. */
export function parseMoneyInput(text: string): Cents | null {
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned === '' || cleaned === '.') return null;
  if (!/^\d{0,7}(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  return Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0'));
}

/** Cents → editable text ("200", "19.99"). */
export function centsToInput(cents: Cents): string {
  const whole = Math.floor(Math.abs(cents) / 100);
  const fraction = Math.abs(cents) % 100;
  return fraction === 0 ? String(whole) : `${whole}.${String(fraction).padStart(2, '0')}`;
}

/** Ratio as a percentage with one decimal, using integer math (0.496 → "49.6%"). */
export function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) return '0.0%';
  const tenths = Math.round((numerator * 1000) / denominator);
  return `${Math.floor(tenths / 10)}.${tenths % 10}%`;
}
