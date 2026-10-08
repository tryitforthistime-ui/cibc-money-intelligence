import { addDays, daysBetween } from './dates';
import type {
  Account,
  Cents,
  Forecast,
  ForecastEntry,
  LowestPoint,
  MoneyState,
  UpcomingTransaction,
} from './types';

export function getAccount(state: MoneyState, id: string): Account {
  const account = state.accounts.find((a) => a.id === id);
  if (!account) throw new Error(`Unknown account ${id}`);
  return account;
}

export function getChequing(state: MoneyState): Account {
  return getAccount(state, state.chequingAccountId);
}

/** Recurring transactions with client overrides applied, ordered by date. */
export function getUpcomingTransactions(state: MoneyState): UpcomingTransaction[] {
  return state.recurring
    .map((t) => {
      const override = state.overrides[t.id] ?? {};
      const amount = override.amount ?? t.amount;
      const date = override.date ?? t.date;
      return {
        ...t,
        amount,
        date,
        originalAmount: t.amount,
        originalDate: t.date,
        isEdited: amount !== t.amount || date !== t.date,
        isExcluded: override.excluded === true,
        dayIndex: daysBetween(state.demoDate, date),
      };
    })
    .sort(
      (a, b) =>
        a.dayIndex - b.dayIndex ||
        // Within a day, expenses come before income (conservative).
        (a.direction === b.direction ? 0 : a.direction === 'expense' ? -1 : 1) ||
        b.amount - a.amount,
    );
}

function sum(transactions: UpcomingTransaction[], direction: 'income' | 'expense'): Cents {
  return transactions
    .filter((t) => t.direction === direction)
    .reduce((total, t) => total + t.amount, 0);
}

export interface ForecastOverrides {
  /** Replace the chequing balance (used to preview a transfer). */
  currentBalance?: Cents;
  buffer?: Cents;
}

/**
 * Projects the chequing balance day by day and derives Safe to Spend.
 *
 * Safe to Spend is the most the client can spend today and still keep the
 * safety buffer intact on every day of the horizon:
 *
 *   Safe to Spend = lowest projected balance − buffer
 *                 = current balance + income that arrives before the lowest point
 *                   − expenses up to the lowest point − buffer
 *
 * When no income lands before the bills (the demo default), this is exactly
 * Current Balance − Upcoming Expenses − Safety Buffer.
 *
 * Within a single day, expenses are assumed to leave before income arrives,
 * so income only counts if it arrives before the spending date.
 */
export function buildForecast(state: MoneyState, overrides: ForecastOverrides = {}): Forecast {
  const horizonDays = state.horizonDays;
  const currentBalance = overrides.currentBalance ?? getChequing(state).balance;
  const buffer = overrides.buffer ?? state.buffer;

  const inHorizon = getUpcomingTransactions(state).filter(
    (t) => t.dayIndex >= 0 && t.dayIndex <= horizonDays,
  );
  const included = inHorizon.filter((t) => !t.isExcluded);
  const excluded = inHorizon.filter((t) => t.isExcluded);

  const entries: ForecastEntry[] = [];
  let lowest: LowestPoint = { date: state.demoDate, dayIndex: -1, balance: currentBalance };
  let running = currentBalance;

  for (let day = 0; day <= horizonDays; day++) {
    const transactions = included.filter((t) => t.dayIndex === day);
    const expenses = sum(transactions, 'expense');
    const income = sum(transactions, 'income');
    const openingBalance = running;
    const lowBalance = openingBalance - expenses;
    const closingBalance = lowBalance + income;
    const date = addDays(state.demoDate, day);

    if (lowBalance < lowest.balance) {
      lowest = { date, dayIndex: day, balance: lowBalance };
    }

    entries.push({
      date,
      dayIndex: day,
      openingBalance,
      income,
      expenses,
      lowBalance,
      closingBalance,
      transactions,
      belowBuffer: lowBalance < buffer,
    });
    running = closingBalance;
  }

  const countedExpenses = sum(
    included.filter((t) => t.dayIndex <= lowest.dayIndex),
    'expense',
  );
  const countedIncome = sum(
    included.filter((t) => t.dayIndex < lowest.dayIndex),
    'income',
  );
  const totalIncome = sum(included, 'income');
  const totalExpenses = sum(included, 'expense');

  return {
    asOf: state.demoDate,
    endDate: addDays(state.demoDate, horizonDays),
    horizonDays,
    currentBalance,
    buffer,
    entries,
    included,
    excluded,
    totalIncome,
    totalExpenses,
    lowestPoint: lowest,
    countedIncome,
    countedExpenses,
    uncountedIncome: totalIncome - countedIncome,
    uncountedExpenses: totalExpenses - countedExpenses,
    safeToSpend: lowest.balance - buffer,
    nextPayday: included.find((t) => t.category === 'payroll'),
    billsCount: included.filter((t) => t.kind === 'bill').length,
  };
}

export type OutlookStatus = 'on-track' | 'tight' | 'below-buffer';

/** Plain-language health of the outlook used for chips and messages. */
export function getOutlookStatus(forecast: Forecast): OutlookStatus {
  if (forecast.safeToSpend < 0) return 'below-buffer';
  if (forecast.safeToSpend < 25_000) return 'tight';
  return 'on-track';
}

/** Entries visible in the 7- or 14-day view (today + N days). */
export function entriesForView(forecast: Forecast, viewDays: number): ForecastEntry[] {
  return forecast.entries.filter((e) => e.dayIndex <= viewDays);
}

/** The largest expenses that bring the balance down to its lowest point. */
export function getLowPointDrivers(forecast: Forecast, limit = 2): UpcomingTransaction[] {
  return forecast.included
    .filter((t) => t.direction === 'expense' && t.dayIndex <= forecast.lowestPoint.dayIndex)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
