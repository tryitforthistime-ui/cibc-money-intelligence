import { buildForecast, entriesForView, getLowPointDrivers, getOutlookStatus } from '../forecast';
import { createInitialState, RECURRING_IDS } from '../mockData';
import { moneyReducer } from '../reducer';

describe('Money Outlook forecast (Epic 1 — Predict)', () => {
  const base = createInitialState();
  const forecast = buildForecast(base);

  it('reconciles to the interview example: $3,420 − $1,840 − $500 = $1,080', () => {
    expect(forecast.currentBalance).toBe(342_000);
    expect(forecast.totalExpenses).toBe(184_000);
    expect(forecast.buffer).toBe(50_000);
    expect(forecast.safeToSpend).toBe(108_000);
    expect(forecast.currentBalance - forecast.totalExpenses - forecast.buffer).toBe(
      forecast.safeToSpend,
    );
  });

  it('reconciles the detailed transactions with the totals', () => {
    const expenses = forecast.included.filter((t) => t.direction === 'expense');
    expect(expenses.map((t) => t.amount)).toEqual([125_000, 8_500, 7_500, 1_999, 41_001]);
    expect(expenses.reduce((s, t) => s + t.amount, 0)).toBe(forecast.totalExpenses);
    expect(forecast.totalIncome).toBe(245_000);
    expect(forecast.countedExpenses + forecast.uncountedExpenses).toBe(forecast.totalExpenses);
    expect(forecast.countedIncome + forecast.uncountedIncome).toBe(forecast.totalIncome);
  });

  it('does not count payday income that arrives after the bills', () => {
    expect(forecast.countedIncome).toBe(0);
    expect(forecast.uncountedIncome).toBe(245_000);
    expect(forecast.nextPayday?.date).toBe('2026-10-15');
  });

  it('anchors to the demo date, not the device clock', () => {
    expect(forecast.asOf).toBe('2026-10-01');
    expect(forecast.endDate).toBe('2026-10-15');
    expect(forecast.entries).toHaveLength(15);
    expect(forecast.entries[0].date).toBe('2026-10-01');
  });

  it('projects daily closing balances', () => {
    const closing = Object.fromEntries(forecast.entries.map((e) => [e.date, e.closingBalance]));
    expect(closing['2026-10-01']).toBe(342_000);
    expect(closing['2026-10-02']).toBe(217_000);
    expect(closing['2026-10-05']).toBe(208_500);
    expect(closing['2026-10-07']).toBe(201_000);
    expect(closing['2026-10-09']).toBe(199_001);
    expect(closing['2026-10-13']).toBe(158_000);
    expect(closing['2026-10-15']).toBe(403_000);
  });

  it('finds the lowest point and the expenses that drive it', () => {
    expect(forecast.lowestPoint).toEqual({ date: '2026-10-13', dayIndex: 12, balance: 158_000 });
    expect(getLowPointDrivers(forecast).map((t) => t.id)).toEqual([
      RECURRING_IDS.rent,
      RECURRING_IDS.visa,
    ]);
  });

  it('counts 3 upcoming bills and reports on-track status', () => {
    expect(forecast.billsCount).toBe(3);
    expect(getOutlookStatus(forecast)).toBe('on-track');
  });

  it('distinguishes confirmed, scheduled and predicted activity', () => {
    const statusById = Object.fromEntries(forecast.included.map((t) => [t.id, t.status]));
    expect(statusById[RECURRING_IDS.internet]).toBe('confirmed');
    expect(statusById[RECURRING_IDS.rent]).toBe('scheduled');
    expect(statusById[RECURRING_IDS.phone]).toBe('predicted');
  });

  it('limits the 7-day view to today plus 7 days', () => {
    const week = entriesForView(forecast, 7);
    expect(week).toHaveLength(8);
    expect(week[week.length - 1].date).toBe('2026-10-08');
  });

  it('recalculates when a predicted transaction is edited', () => {
    const edited = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.phone,
      amount: 10_000,
      date: '2026-10-07',
    });
    const f = buildForecast(edited);
    expect(f.totalExpenses).toBe(186_500);
    expect(f.safeToSpend).toBe(105_500);
    expect(f.included.find((t) => t.id === RECURRING_IDS.phone)?.isEdited).toBe(true);
  });

  it('recalculates when an incorrectly identified payment is excluded and restored', () => {
    const excluded = moneyReducer(base, { type: 'EXCLUDE_TRANSACTION', id: RECURRING_IDS.streaming });
    const f = buildForecast(excluded);
    expect(f.safeToSpend).toBe(109_999);
    expect(f.excluded.map((t) => t.id)).toEqual([RECURRING_IDS.streaming]);
    const restored = moneyReducer(excluded, { type: 'INCLUDE_TRANSACTION', id: RECURRING_IDS.streaming });
    expect(buildForecast(restored).safeToSpend).toBe(108_000);
  });

  it('recalculates when the safety buffer changes', () => {
    const f = buildForecast(moneyReducer(base, { type: 'SET_BUFFER', amount: 75_000 }));
    expect(f.safeToSpend).toBe(83_000);
  });

  it('counts income only when it arrives before the relevant spending date', () => {
    // Move payday earlier, before StreamPlus and the Visa payment.
    const early = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.payroll,
      amount: 245_000,
      date: '2026-10-08',
    });
    const f = buildForecast(early);
    // Lowest point is now Oct 7 (after rent, internet, phone): 3,420 − 1,410 = 2,010.
    expect(f.lowestPoint.date).toBe('2026-10-07');
    expect(f.countedExpenses).toBe(141_000);
    expect(f.countedIncome).toBe(0);
    expect(f.safeToSpend).toBe(151_000);
    expect(f.currentBalance + f.countedIncome - f.countedExpenses - f.buffer).toBe(f.safeToSpend);
  });

  it('assumes same-day expenses leave before income arrives', () => {
    const sameDay = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.visa,
      amount: 41_001,
      date: '2026-10-15',
    });
    const f = buildForecast(sameDay);
    expect(f.lowestPoint.date).toBe('2026-10-15');
    expect(f.countedIncome).toBe(0);
    expect(f.safeToSpend).toBe(108_000);
  });

  it('reports a negative Safe to Spend when expenses exceed the cushion', () => {
    const big = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.phone,
      amount: 120_000,
      date: '2026-10-07',
    });
    const f = buildForecast(big);
    expect(f.safeToSpend).toBe(-4_500);
    expect(getOutlookStatus(f)).toBe('below-buffer');
    expect(f.entries.some((e) => e.belowBuffer)).toBe(true);
  });

  it('ignores transactions outside the horizon', () => {
    const later = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.phone,
      amount: 7_500,
      date: '2026-10-20',
    });
    const f = buildForecast(later);
    expect(f.included.some((t) => t.id === RECURRING_IDS.phone)).toBe(false);
    expect(f.safeToSpend).toBe(115_500);
    expect(f.billsCount).toBe(2);
  });
});
