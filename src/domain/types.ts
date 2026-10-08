/**
 * Domain model for CIBC Money Intelligence (concept prototype).
 *
 * All money values are integer cents to keep arithmetic exact.
 * All dates are ISO calendar dates (YYYY-MM-DD) anchored to a configurable
 * demo date — the device clock is never used.
 */

export type Cents = number;
export type ISODate = string;

export type AccountType = 'chequing' | 'savings' | 'credit' | 'loan';

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  productName: string;
  /** Last four digits shown as a mask (fictional). */
  mask: string;
  /** Chequing/savings: available balance. Credit/loan: amount owing. */
  balance: Cents;
}

/** How certain the bank is about an upcoming transaction. */
export type TransactionStatus = 'confirmed' | 'scheduled' | 'predicted';
export type TransactionDirection = 'income' | 'expense';
export type TransactionKind = 'income' | 'bill' | 'subscription' | 'card-payment';
export type TransactionCategory =
  | 'payroll'
  | 'housing'
  | 'internet'
  | 'phone'
  | 'streaming'
  | 'credit-card';

export interface HistoricalOccurrence {
  date: ISODate;
  amount: Cents;
}

/** A recurring transaction detected on (or scheduled against) the chequing account. */
export interface RecurringTransaction {
  id: string;
  name: string;
  merchant: string;
  direction: TransactionDirection;
  kind: TransactionKind;
  category: TransactionCategory;
  frequency: 'monthly' | 'semi-monthly';
  accountId: string;
  /** Always positive; `direction` gives the sign. */
  amount: Cents;
  /** Next expected occurrence. */
  date: ISODate;
  status: TransactionStatus;
  /** Plain-language explanation of how this was identified. */
  source: string;
  history: HistoricalOccurrence[];
}

/** Client corrections applied on top of the detected data. */
export interface TransactionOverride {
  amount?: Cents;
  date?: ISODate;
  excluded?: boolean;
}

/** A recurring transaction after client overrides, positioned in the forecast window. */
export interface UpcomingTransaction extends RecurringTransaction {
  originalAmount: Cents;
  originalDate: ISODate;
  isEdited: boolean;
  isExcluded: boolean;
  /** Days after the demo date (0 = today). */
  dayIndex: number;
}

/** One day of the projected chequing balance. */
export interface ForecastEntry {
  date: ISODate;
  dayIndex: number;
  openingBalance: Cents;
  income: Cents;
  expenses: Cents;
  /** Intra-day low: expenses are assumed to leave before income arrives. */
  lowBalance: Cents;
  closingBalance: Cents;
  transactions: UpcomingTransaction[];
  belowBuffer: boolean;
}

export interface LowestPoint {
  date: ISODate;
  /** -1 when the current balance itself is the lowest point. */
  dayIndex: number;
  balance: Cents;
}

export interface Forecast {
  asOf: ISODate;
  endDate: ISODate;
  horizonDays: number;
  currentBalance: Cents;
  buffer: Cents;
  entries: ForecastEntry[];
  /** Transactions inside the horizon that count toward the forecast. */
  included: UpcomingTransaction[];
  /** Transactions inside the horizon the client excluded. */
  excluded: UpcomingTransaction[];
  totalIncome: Cents;
  totalExpenses: Cents;
  lowestPoint: LowestPoint;
  /** Income that arrives before the lowest point (and therefore protects it). */
  countedIncome: Cents;
  /** Expenses up to and including the lowest point. */
  countedExpenses: Cents;
  /** Income inside the horizon that arrives too late to be spent against bills. */
  uncountedIncome: Cents;
  /** Expenses after the lowest point (covered by income that arrives first). */
  uncountedExpenses: Cents;
  safeToSpend: Cents;
  nextPayday?: UpcomingTransaction;
  billsCount: number;
}

export type RecommendationType = 'shortfall' | 'savings' | 'subscription' | 'rule';
export type RecommendationSeverity = 'alert' | 'watch' | 'opportunity' | 'insight';
export type RecommendationStatus = 'active' | 'dismissed' | 'completed' | 'useful';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  severity: RecommendationSeverity;
  eyebrow: string;
  title: string;
  body: string;
  reasoning: string[];
  ctaLabel: string;
  status: RecommendationStatus;
  suggestedAmount?: Cents;
  relatedTransactionIds: string[];
  /** Short line shown once the client has acted on the recommendation. */
  outcome?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  /** The goal's saved amount is the balance of this account (single source of truth). */
  accountId: string;
  target: Cents;
  pastContributions: HistoricalOccurrence[];
}

export interface SavingsRule {
  id: string;
  goalId: string;
  /** Suggest a transfer when Safe to Spend is above this amount. */
  threshold: Cents;
  amount: Cents;
  enabled: boolean;
  /** False until the client saves the rule for the first time. */
  saved: boolean;
}

export type TransferSource = 'recommendation' | 'rule' | 'manual';

export interface SimulatedTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: Cents;
  date: ISODate;
  confirmationNumber: string;
  source: TransferSource;
  recommendationId?: string;
}

export interface MoneyState {
  demoDate: ISODate;
  horizonDays: number;
  client: { firstName: string; lastName: string };
  accounts: Account[];
  chequingAccountId: string;
  recurring: RecurringTransaction[];
  overrides: Record<string, TransactionOverride>;
  buffer: Cents;
  recommendedBuffer: Cents;
  viewDays: 7 | 14;
  goal: SavingsGoal;
  rule: SavingsRule;
  transfers: SimulatedTransfer[];
  /** Client feedback on recommendations. "completed" is derived from transfers. */
  recommendationFeedback: Record<string, 'dismissed' | 'useful'>;
  history: {
    /** Average lowest chequing balance before payday over the last 3 pay periods. */
    usualLowBeforePayday: Cents;
  };
  creditCard: { statementBalance: Cents; dueDate: ISODate };
}
