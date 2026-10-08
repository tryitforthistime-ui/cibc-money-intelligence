import { formatMoney } from './money';
import type { Cents, Forecast, SavingsRule } from './types';

const fmt = (cents: Cents) => formatMoney(cents, { decimals: 'auto' });

export const MIN_RULE_AMOUNT: Cents = 1_000;

export interface RuleErrors {
  threshold?: string;
  amount?: string;
}

export function validateRule(threshold: Cents | null, amount: Cents | null): RuleErrors {
  const errors: RuleErrors = {};
  if (threshold === null) errors.threshold = 'Enter a balance threshold.';
  if (amount === null || amount <= 0) {
    errors.amount = 'Enter an amount to move.';
  } else if (amount < MIN_RULE_AMOUNT) {
    errors.amount = `Suggest at least ${fmt(MIN_RULE_AMOUNT)}.`;
  } else if (threshold !== null && amount > threshold) {
    errors.amount = 'Keep the amount at or below the threshold so your buffer stays protected.';
  }
  return errors;
}

export function describeRule(rule: Pick<SavingsRule, 'threshold' | 'amount'>): string {
  return `When my projected balance is above ${fmt(rule.threshold)} after upcoming expenses and my safety buffer, suggest moving ${fmt(rule.amount)} to savings.`;
}

export interface RuleEvaluation {
  triggers: boolean;
  message: string;
}

/** Rules only ever suggest. A suggestion never exceeds Safe to Spend. */
export function evaluateRule(
  rule: Pick<SavingsRule, 'threshold' | 'amount' | 'enabled'>,
  forecast: Forecast,
): RuleEvaluation {
  const sts = forecast.safeToSpend;
  if (!rule.enabled) {
    return { triggers: false, message: 'This rule is off, so it won’t make suggestions.' };
  }
  if (sts > rule.threshold && rule.amount <= sts) {
    return {
      triggers: true,
      message: `Today your projected balance after expenses and buffer is ${fmt(sts)}, above ${fmt(rule.threshold)}. This rule would suggest moving ${fmt(rule.amount)}.`,
    };
  }
  return {
    triggers: false,
    message: `Today your projected balance after expenses and buffer is ${fmt(sts)}, not above ${fmt(rule.threshold)}. This rule wouldn’t suggest a transfer.`,
  };
}
