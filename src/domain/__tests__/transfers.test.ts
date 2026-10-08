import { buildForecast, getAccount } from '../forecast';
import { getGoalProgress } from '../goals';
import { ACCOUNT_IDS, createInitialState } from '../mockData';
import { buildRecommendations, RECOMMENDATION_IDS } from '../recommendations';
import { moneyReducer } from '../reducer';
import {
  createTransfer,
  previewTransfer,
  suggestSavingsAmount,
  validateTransfer,
} from '../transfers';

describe('Simulated transfers (Epic 3 — Act)', () => {
  const base = createInitialState();

  it('suggests 20% of Safe to Spend rounded down to $50', () => {
    expect(suggestSavingsAmount(108_000)).toBe(20_000);
    expect(suggestSavingsAmount(88_000)).toBe(15_000);
    expect(suggestSavingsAmount(20_000)).toBe(0);
    expect(suggestSavingsAmount(-5_000)).toBe(0);
  });

  it('previews every affected balance before confirmation', () => {
    const preview = previewTransfer(base, 20_000);
    expect(preview.chequing).toEqual({ before: 342_000, after: 322_000 });
    expect(preview.savings).toEqual({ before: 1_240_000, after: 1_260_000 });
    expect(preview.safeToSpend).toEqual({ before: 108_000, after: 88_000 });
    expect(preview.goal.before.percentLabel).toBe('49.6%');
    expect(preview.goal.after.percentLabel).toBe('50.4%');
  });

  it('updates chequing, savings, goal, forecast and recommendation on confirm', () => {
    const transfer = createTransfer(base, 20_000, 'recommendation', RECOMMENDATION_IDS.savings);
    const next = moneyReducer(base, { type: 'COMPLETE_TRANSFER', transfer });

    expect(getAccount(next, ACCOUNT_IDS.chequing).balance).toBe(322_000);
    expect(getAccount(next, ACCOUNT_IDS.savings).balance).toBe(1_260_000);

    const goal = getGoalProgress(next);
    expect(goal.saved).toBe(1_260_000);
    expect(goal.percentLabel).toBe('50.4%');

    const forecast = buildForecast(next);
    expect(forecast.safeToSpend).toBe(88_000);
    // The transfer is not double counted as an upcoming expense.
    expect(forecast.totalExpenses).toBe(184_000);

    const savingsRec = buildRecommendations(next, forecast).find(
      (r) => r.id === RECOMMENDATION_IDS.savings,
    );
    expect(savingsRec?.status).toBe('completed');
    expect(transfer.confirmationNumber).toBe('MI-20261001-0001');
  });

  it('ignores a duplicate confirmation of the same transfer', () => {
    const transfer = createTransfer(base, 20_000, 'recommendation', RECOMMENDATION_IDS.savings);
    const once = moneyReducer(base, { type: 'COMPLETE_TRANSFER', transfer });
    const twice = moneyReducer(once, { type: 'COMPLETE_TRANSFER', transfer });
    expect(twice).toBe(once);
    expect(getAccount(twice, ACCOUNT_IDS.chequing).balance).toBe(322_000);
  });

  it('keeps total money constant across own accounts', () => {
    const total = (s: typeof base) =>
      getAccount(s, ACCOUNT_IDS.chequing).balance + getAccount(s, ACCOUNT_IDS.savings).balance;
    const transfer = createTransfer(base, 12_345, 'manual');
    const next = moneyReducer(base, { type: 'COMPLETE_TRANSFER', transfer });
    expect(total(next)).toBe(total(base));
  });

  it('validates amounts with clear error feedback', () => {
    expect(validateTransfer(base, 20_000)).toEqual({ ok: true, maxSafeAmount: 108_000 });
    expect(validateTransfer(base, 108_000).ok).toBe(true);
    expect(validateTransfer(base, null).error).toMatch(/greater than \$0/);
    expect(validateTransfer(base, 0).ok).toBe(false);
    expect(validateTransfer(base, 108_001).error).toMatch(/below your \$500 safety buffer/);
    expect(validateTransfer(base, 400_000).error).toMatch(/available balance/);
  });

  it('blocks transfers when the outlook is already below the buffer', () => {
    const tight = moneyReducer(base, { type: 'SET_BUFFER', amount: 200_000 });
    const result = validateTransfer(tight, 5_000);
    expect(result.ok).toBe(false);
    expect(result.maxSafeAmount).toBe(0);
  });

  it('restores the original demo on reset', () => {
    const transfer = createTransfer(base, 20_000, 'recommendation', RECOMMENDATION_IDS.savings);
    const changed = moneyReducer(base, { type: 'COMPLETE_TRANSFER', transfer });
    const reset = moneyReducer(changed, { type: 'RESET_DEMO' });
    expect(reset).toEqual(createInitialState());
    expect(buildForecast(reset).safeToSpend).toBe(108_000);
  });
});
