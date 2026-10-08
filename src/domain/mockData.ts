import type { MoneyState, RecurringTransaction } from './types';

/**
 * Single source of truth for all demonstration data.
 *
 * Everything shown in the prototype is derived from `createInitialState()`.
 * The numbers reconcile to the Money Outlook example used in the interview:
 *
 *   Current balance        $3,420.00
 *   Upcoming expenses     −$1,840.00   (rent 1,250 + internet 85 + phone 75
 *                                       + StreamPlus 19.99 + Visa payment 410.01)
 *   Recommended buffer      −$500.00
 *   ──────────────────────────────────
 *   Safe to spend          $1,080.00   until payday on Thursday, October 15
 *
 * All people, merchants and account numbers are fictional.
 */
export const DEMO_CONFIG = {
  /** Anchor date for every calculation. Change it to re-run the demo on other dates. */
  demoDate: '2026-10-01',
  /** Forecast horizon: today plus the next 14 days (ends on payday). */
  horizonDays: 14,
} as const;

export const ACCOUNT_IDS = {
  chequing: 'acct-chequing',
  savings: 'acct-savings',
  visa: 'acct-visa',
  loan: 'acct-loan',
} as const;

export const RECURRING_IDS = {
  rent: 'txn-rent',
  internet: 'txn-internet',
  phone: 'txn-phone',
  streaming: 'txn-streamplus',
  visa: 'txn-visa-payment',
  payroll: 'txn-payroll',
} as const;

const recurring: RecurringTransaction[] = [
  {
    id: RECURRING_IDS.rent,
    name: 'Rent',
    merchant: 'Lakeshore Property Mgmt.',
    direction: 'expense',
    kind: 'bill',
    category: 'housing',
    frequency: 'monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 125_000,
    date: '2026-10-02',
    status: 'scheduled',
    source: 'Interac e-Transfer you scheduled for the 2nd of every month.',
    history: [
      { date: '2026-07-02', amount: 125_000 },
      { date: '2026-08-02', amount: 125_000 },
      { date: '2026-09-02', amount: 125_000 },
    ],
  },
  {
    id: RECURRING_IDS.internet,
    name: 'Internet',
    merchant: 'Northwind Fibre',
    direction: 'expense',
    kind: 'bill',
    category: 'internet',
    frequency: 'monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 8_500,
    date: '2026-10-05',
    status: 'confirmed',
    source: 'eBill received Sep 25. Paid by pre-authorized debit.',
    history: [
      { date: '2026-07-05', amount: 8_500 },
      { date: '2026-08-05', amount: 8_500 },
      { date: '2026-09-05', amount: 8_500 },
    ],
  },
  {
    id: RECURRING_IDS.phone,
    name: 'Phone',
    merchant: 'Maple Mobile',
    direction: 'expense',
    kind: 'bill',
    category: 'phone',
    frequency: 'monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 7_500,
    date: '2026-10-07',
    status: 'predicted',
    source: 'Detected from 6 monthly payments between $72.40 and $78.15 (average $75.00).',
    history: [
      { date: '2026-04-07', amount: 7_240 },
      { date: '2026-05-07', amount: 7_815 },
      { date: '2026-06-07', amount: 7_430 },
      { date: '2026-07-07', amount: 7_560 },
      { date: '2026-08-07', amount: 7_385 },
      { date: '2026-09-07', amount: 7_570 },
    ],
  },
  {
    id: RECURRING_IDS.streaming,
    name: 'StreamPlus',
    merchant: 'StreamPlus Premium',
    direction: 'expense',
    kind: 'subscription',
    category: 'streaming',
    frequency: 'monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 1_999,
    date: '2026-10-09',
    status: 'predicted',
    source: 'Detected from 8 monthly charges of $19.99 on the 9th.',
    history: [
      { date: '2026-02-09', amount: 1_999 },
      { date: '2026-03-09', amount: 1_999 },
      { date: '2026-04-09', amount: 1_999 },
      { date: '2026-05-09', amount: 1_999 },
      { date: '2026-06-09', amount: 1_999 },
      { date: '2026-07-09', amount: 1_999 },
      { date: '2026-08-09', amount: 1_999 },
      { date: '2026-09-09', amount: 1_999 },
    ],
  },
  {
    id: RECURRING_IDS.visa,
    name: 'CIBC Visa payment',
    merchant: 'CIBC Dividend Visa ···4021',
    direction: 'expense',
    kind: 'card-payment',
    category: 'credit-card',
    frequency: 'monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 41_001,
    date: '2026-10-13',
    status: 'scheduled',
    source: 'Automatic payment of your statement balance, due Oct 13.',
    history: [
      { date: '2026-08-13', amount: 38_712 },
      { date: '2026-09-13', amount: 45_233 },
    ],
  },
  {
    id: RECURRING_IDS.payroll,
    name: 'Payroll',
    merchant: 'Northbridge Design Inc.',
    direction: 'income',
    kind: 'income',
    category: 'payroll',
    frequency: 'semi-monthly',
    accountId: ACCOUNT_IDS.chequing,
    amount: 245_000,
    date: '2026-10-15',
    status: 'predicted',
    source: 'Detected from 12 semi-monthly direct deposits of $2,450.00.',
    history: [
      { date: '2026-08-14', amount: 245_000 },
      { date: '2026-08-31', amount: 245_000 },
      { date: '2026-09-15', amount: 245_000 },
      { date: '2026-09-30', amount: 245_000 },
    ],
  },
];

export function createInitialState(): MoneyState {
  return {
    demoDate: DEMO_CONFIG.demoDate,
    horizonDays: DEMO_CONFIG.horizonDays,
    client: { firstName: 'Alex', lastName: 'Martin' },
    accounts: [
      {
        id: ACCOUNT_IDS.chequing,
        type: 'chequing',
        name: 'CIBC Smart Account',
        productName: 'Chequing',
        mask: '4318',
        balance: 342_000,
      },
      {
        id: ACCOUNT_IDS.savings,
        type: 'savings',
        name: 'Home Down Payment Savings',
        productName: 'CIBC eAdvantage Savings',
        mask: '7742',
        balance: 1_240_000,
      },
      {
        id: ACCOUNT_IDS.visa,
        type: 'credit',
        name: 'CIBC Dividend® Visa* Card',
        productName: 'Credit card',
        mask: '4021',
        balance: 61_240,
      },
      {
        id: ACCOUNT_IDS.loan,
        type: 'loan',
        name: 'Personal Loan',
        productName: 'Loan',
        mask: '4821',
        balance: 481_236,
      },
    ],
    chequingAccountId: ACCOUNT_IDS.chequing,
    recurring: recurring.map((r) => ({ ...r, history: r.history.map((h) => ({ ...h })) })),
    overrides: {},
    buffer: 50_000,
    recommendedBuffer: 50_000,
    viewDays: 14,
    goal: {
      id: 'goal-home',
      name: 'Home Down Payment',
      accountId: ACCOUNT_IDS.savings,
      target: 2_500_000,
      pastContributions: [
        { date: '2026-09-15', amount: 30_000 },
        { date: '2026-08-31', amount: 30_000 },
        { date: '2026-08-14', amount: 30_000 },
      ],
    },
    rule: {
      id: 'rule-1',
      goalId: 'goal-home',
      threshold: 100_000,
      amount: 10_000,
      enabled: true,
      saved: false,
    },
    transfers: [],
    recommendationFeedback: {},
    history: { usualLowBeforePayday: 224_000 },
    creditCard: { statementBalance: 41_001, dueDate: '2026-10-13' },
  };
}
