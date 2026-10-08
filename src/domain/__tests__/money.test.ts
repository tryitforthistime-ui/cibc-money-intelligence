import { addDays, daysBetween, formatDate } from '../dates';
import {
  centsToInput,
  formatDirectional,
  formatMoney,
  formatPercent,
  MINUS,
  parseMoneyInput,
  sanitizeMoneyInput,
} from '../money';

describe('money formatting', () => {
  it('formats cents as Canadian dollars', () => {
    expect(formatMoney(108_000)).toBe('$1,080.00');
    expect(formatMoney(108_000, { decimals: 'auto' })).toBe('$1,080');
    expect(formatMoney(1_999, { decimals: 'auto' })).toBe('$19.99');
    expect(formatMoney(-184_000, { decimals: 'auto' })).toBe(`${MINUS}$1,840`);
    expect(formatMoney(245_000, { sign: 'always' })).toBe('+$2,450.00');
    expect(formatMoney(0, { sign: 'always' })).toBe('$0.00');
  });

  it('formats directional amounts', () => {
    expect(formatDirectional(125_000, 'expense')).toBe(`${MINUS}$1,250.00`);
    expect(formatDirectional(245_000, 'income')).toBe('+$2,450.00');
  });

  it('parses and sanitizes user input', () => {
    expect(parseMoneyInput('200')).toBe(20_000);
    expect(parseMoneyInput('$1,080.5')).toBe(108_050);
    expect(parseMoneyInput('19.99')).toBe(1_999);
    expect(parseMoneyInput('')).toBeNull();
    expect(parseMoneyInput('abc')).toBeNull();
    expect(sanitizeMoneyInput('12a3.456')).toBe('123.45');
    expect(sanitizeMoneyInput('007')).toBe('7');
    expect(sanitizeMoneyInput('.5')).toBe('0.5');
    expect(centsToInput(1_999)).toBe('19.99');
    expect(centsToInput(20_000)).toBe('200');
  });

  it('formats goal percentages exactly', () => {
    expect(formatPercent(1_240_000, 2_500_000)).toBe('49.6%');
    expect(formatPercent(1_260_000, 2_500_000)).toBe('50.4%');
  });
});

describe('demo dates', () => {
  it('does calendar math independent of time zone', () => {
    expect(addDays('2026-10-01', 14)).toBe('2026-10-15');
    expect(daysBetween('2026-10-01', '2026-10-15')).toBe(14);
    expect(formatDate('2026-10-15', 'long')).toBe('October 15');
    expect(formatDate('2026-10-01', 'weekdayLong')).toBe('Thursday, October 1');
    expect(formatDate('2026-10-13', 'weekdayShort')).toBe('Tue, Oct 13');
  });
});
