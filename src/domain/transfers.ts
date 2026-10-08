import { buildForecast, getAccount, getChequing } from './forecast';
import { goalProgressFor, type GoalProgress } from './goals';
import { formatDate } from './dates';
import { formatMoney } from './money';
import type { Cents, MoneyState, SimulatedTransfer, TransferSource } from './types';

/** Savings suggestions use up to 20% of Safe to Spend, rounded down to $50. */
export const SAVINGS_SUGGESTION_RATE = 0.2;
export const SAVINGS_SUGGESTION_STEP: Cents = 5_000;

export function suggestSavingsAmount(safeToSpend: Cents): Cents {
  if (safeToSpend <= 0) return 0;
  const raw = safeToSpend * SAVINGS_SUGGESTION_RATE;
  const rounded = Math.floor(raw / SAVINGS_SUGGESTION_STEP) * SAVINGS_SUGGESTION_STEP;
  // Never suggest more than is safe (guards tiny or unusual inputs).
  return rounded >= SAVINGS_SUGGESTION_STEP && rounded <= safeToSpend ? rounded : 0;
}

export interface TransferValidation {
  ok: boolean;
  error?: string;
  /** The most that can move without breaching the buffer or overdrawing. */
  maxSafeAmount: Cents;
}

export function validateTransfer(state: MoneyState, amount: Cents | null): TransferValidation {
  const forecast = buildForecast(state);
  const available = getChequing(state).balance;
  const maxSafeAmount = Math.max(0, Math.min(forecast.safeToSpend, available));
  const until = formatDate(forecast.endDate, 'short');

  if (amount === null || amount <= 0) {
    return { ok: false, error: 'Enter an amount greater than $0.', maxSafeAmount };
  }
  if (amount > available) {
    return {
      ok: false,
      error: `That's more than your available balance of ${formatMoney(available)}.`,
      maxSafeAmount,
    };
  }
  if (forecast.safeToSpend <= 0) {
    return {
      ok: false,
      error: `Your projected balance is already at or below your ${formatMoney(forecast.buffer, { decimals: 'auto' })} safety buffer before ${until}, so we can't move money to savings right now.`,
      maxSafeAmount,
    };
  }
  if (amount > forecast.safeToSpend) {
    return {
      ok: false,
      error: `This would take your projected balance below your ${formatMoney(forecast.buffer, { decimals: 'auto' })} safety buffer before ${until}. You can move up to ${formatMoney(maxSafeAmount)}.`,
      maxSafeAmount,
    };
  }
  return { ok: true, maxSafeAmount };
}

export interface TransferPreview {
  amount: Cents;
  chequing: { before: Cents; after: Cents };
  savings: { before: Cents; after: Cents };
  safeToSpend: { before: Cents; after: Cents };
  goal: { before: GoalProgress; after: GoalProgress };
}

/** Shows exactly what a transfer would change, using the same forecast rules. */
export function previewTransfer(state: MoneyState, amount: Cents): TransferPreview {
  const chequing = getChequing(state);
  const savings = getAccount(state, state.goal.accountId);
  const before = buildForecast(state);
  const after = buildForecast(state, { currentBalance: chequing.balance - amount });
  return {
    amount,
    chequing: { before: chequing.balance, after: chequing.balance - amount },
    savings: { before: savings.balance, after: savings.balance + amount },
    safeToSpend: { before: before.safeToSpend, after: after.safeToSpend },
    goal: {
      before: goalProgressFor(state.goal.name, savings.balance, state.goal.target),
      after: goalProgressFor(state.goal.name, savings.balance + amount, state.goal.target),
    },
  };
}

export function createTransfer(
  state: MoneyState,
  amount: Cents,
  source: TransferSource,
  recommendationId?: string,
): SimulatedTransfer {
  const sequence = state.transfers.length + 1;
  return {
    id: `trf-${sequence}`,
    fromAccountId: state.chequingAccountId,
    toAccountId: state.goal.accountId,
    amount,
    date: state.demoDate,
    confirmationNumber: `MI-${state.demoDate.replace(/-/g, '')}-${String(sequence).padStart(4, '0')}`,
    source,
    recommendationId,
  };
}

/**
 * Applies a simulated transfer between the client's own accounts.
 *
 * The transfer is counted once: it lowers the chequing balance (which the
 * forecast starts from) and raises the savings balance (which is the goal's
 * saved amount). It is never added as an upcoming expense, so it can't be
 * double counted. Applying the same transfer twice has no effect.
 */
export function applyTransfer(state: MoneyState, transfer: SimulatedTransfer): MoneyState {
  if (state.transfers.some((t) => t.id === transfer.id)) return state;
  return {
    ...state,
    accounts: state.accounts.map((account) => {
      if (account.id === transfer.fromAccountId) {
        return { ...account, balance: account.balance - transfer.amount };
      }
      if (account.id === transfer.toAccountId) {
        return { ...account, balance: account.balance + transfer.amount };
      }
      return account;
    }),
    transfers: [...state.transfers, transfer],
  };
}
