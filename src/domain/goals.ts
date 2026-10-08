import { getAccount } from './forecast';
import { formatPercent } from './money';
import type { Cents, MoneyState } from './types';

export interface GoalProgress {
  name: string;
  saved: Cents;
  target: Cents;
  remaining: Cents;
  /** 0..1, clamped for progress bars. */
  ratio: number;
  percentLabel: string;
}

export function goalProgressFor(name: string, saved: Cents, target: Cents): GoalProgress {
  return {
    name,
    saved,
    target,
    remaining: Math.max(0, target - saved),
    ratio: target > 0 ? Math.min(1, Math.max(0, saved / target)) : 0,
    percentLabel: formatPercent(saved, target),
  };
}

/** The goal's saved amount is the linked savings account balance. */
export function getGoalProgress(state: MoneyState): GoalProgress {
  const saved = getAccount(state, state.goal.accountId).balance;
  return goalProgressFor(state.goal.name, saved, state.goal.target);
}
