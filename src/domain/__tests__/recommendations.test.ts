import { buildForecast } from '../forecast';
import { createInitialState, RECURRING_IDS } from '../mockData';
import {
  buildRecommendations,
  RECOMMENDATION_IDS,
  visibleRecommendations,
} from '../recommendations';
import { moneyReducer } from '../reducer';
import { evaluateRule, validateRule } from '../rules';
import { createTransfer } from '../transfers';
import type { MoneyState } from '../types';

const recsFor = (state: MoneyState) => buildRecommendations(state, buildForecast(state));
const byId = (state: MoneyState, id: string) => recsFor(state).find((r) => r.id === id);

describe('Recommendations (Epic 2 — Advise)', () => {
  const base = createInitialState();

  it('shows the three demo recommendations', () => {
    expect(recsFor(base).map((r) => r.id)).toEqual([
      RECOMMENDATION_IDS.shortfall,
      RECOMMENDATION_IDS.savings,
      RECOMMENDATION_IDS.subscription,
    ]);
  });

  it('explains the shortfall with its reasoning and related transactions', () => {
    const rec = byId(base, RECOMMENDATION_IDS.shortfall)!;
    expect(rec.title).toBe('Heads up: your balance may be lower than usual.');
    expect(rec.body).toContain('below your preferred $500 buffer before payday');
    expect(rec.relatedTransactionIds).toEqual([RECURRING_IDS.rent, RECURRING_IDS.visa]);
    expect(rec.reasoning.length).toBeGreaterThan(2);
  });

  it('suggests $200 for the Home Down Payment goal without breaching the buffer', () => {
    const rec = byId(base, RECOMMENDATION_IDS.savings)!;
    expect(rec.title).toBe('You may have room to save $200.');
    expect(rec.ctaLabel).toBe('Move $200 to savings');
    expect(rec.suggestedAmount).toBe(20_000);
    expect(rec.suggestedAmount!).toBeLessThanOrEqual(buildForecast(base).safeToSpend);
  });

  it('detects the $19.99 subscription', () => {
    const rec = byId(base, RECOMMENDATION_IDS.subscription)!;
    expect(rec.body).toBe(
      'We detected a $19.99 monthly subscription that you may want to review.',
    );
  });

  it('responds to forecast changes: alert and no savings suggestion when below buffer', () => {
    const tight = moneyReducer(base, {
      type: 'EDIT_TRANSACTION',
      id: RECURRING_IDS.phone,
      amount: 120_000,
      date: '2026-10-07',
    });
    const recs = recsFor(tight);
    expect(recs.find((r) => r.id === RECOMMENDATION_IDS.shortfall)?.severity).toBe('alert');
    expect(recs.some((r) => r.id === RECOMMENDATION_IDS.savings)).toBe(false);
  });

  it('never suggests a transfer larger than Safe to Spend', () => {
    for (let buffer = 0; buffer <= 300_000; buffer += 2_500) {
      const state = moneyReducer(base, { type: 'SET_BUFFER', amount: buffer });
      const sts = buildForecast(state).safeToSpend;
      for (const rec of recsFor(state)) {
        if (rec.status !== 'completed' && rec.suggestedAmount !== undefined) {
          expect(rec.suggestedAmount).toBeLessThanOrEqual(sts);
        }
      }
    }
  });

  it('keeps dismissed recommendations dismissed and can restore them', () => {
    const dismissed = moneyReducer(base, {
      type: 'DISMISS_RECOMMENDATION',
      id: RECOMMENDATION_IDS.subscription,
    });
    // Unrelated changes do not bring it back.
    const later = moneyReducer(dismissed, { type: 'SET_BUFFER', amount: 60_000 });
    expect(visibleRecommendations(recsFor(later)).map((r) => r.id)).not.toContain(
      RECOMMENDATION_IDS.subscription,
    );
    const restored = moneyReducer(later, { type: 'RESTORE_DISMISSED' });
    expect(visibleRecommendations(recsFor(restored)).map((r) => r.id)).toContain(
      RECOMMENDATION_IDS.subscription,
    );
  });

  it('records "useful" feedback', () => {
    const useful = moneyReducer(base, {
      type: 'MARK_RECOMMENDATION_USEFUL',
      id: RECOMMENDATION_IDS.subscription,
    });
    expect(byId(useful, RECOMMENDATION_IDS.subscription)?.status).toBe('useful');
  });

  it('avoids guaranteed-outcome language', () => {
    const text = recsFor(base)
      .flatMap((r) => [r.title, r.body, ...r.reasoning])
      .join(' ')
      .toLowerCase();
    expect(text).not.toMatch(/guarantee|risk-free|will definitely|always have/);
  });

  it('marks the savings recommendation completed after the transfer', () => {
    const transfer = createTransfer(base, 20_000, 'recommendation', RECOMMENDATION_IDS.savings);
    const next = moneyReducer(base, { type: 'COMPLETE_TRANSFER', transfer });
    const rec = byId(next, RECOMMENDATION_IDS.savings)!;
    expect(rec.status).toBe('completed');
    expect(rec.body).toContain('50.4%');
    // The shortfall insight now reflects the new Safe to Spend.
    expect(byId(next, RECOMMENDATION_IDS.shortfall)?.body).toContain('$880');
  });
});

describe('Smart Savings Rules (Epic 3 — Feature B)', () => {
  const base = createInitialState();

  it('validates inputs', () => {
    expect(validateRule(100_000, 10_000)).toEqual({});
    expect(validateRule(null, 10_000).threshold).toBeDefined();
    expect(validateRule(100_000, null).amount).toBeDefined();
    expect(validateRule(100_000, 500).amount).toMatch(/at least/);
    expect(validateRule(5_000, 10_000).amount).toMatch(/at or below the threshold/);
  });

  it('evaluates the rule against the forecast', () => {
    const rule = { threshold: 100_000, amount: 10_000, enabled: true };
    expect(evaluateRule(rule, buildForecast(base)).triggers).toBe(true);
    expect(evaluateRule({ ...rule, enabled: false }, buildForecast(base)).triggers).toBe(false);
    expect(evaluateRule({ ...rule, threshold: 120_000 }, buildForecast(base)).triggers).toBe(false);
  });

  it('only suggests (never moves money) once a rule is saved and enabled', () => {
    expect(byId(base, RECOMMENDATION_IDS.rule)).toBeUndefined();
    const saved = moneyReducer(base, {
      type: 'SAVE_RULE',
      rule: { threshold: 100_000, amount: 10_000, enabled: true },
    });
    const rec = byId(saved, RECOMMENDATION_IDS.rule)!;
    expect(rec.ctaLabel).toBe('Move $100 to savings');
    expect(saved.accounts).toEqual(base.accounts);
    expect(saved.transfers).toHaveLength(0);

    const disabled = moneyReducer(saved, {
      type: 'SAVE_RULE',
      rule: { threshold: 100_000, amount: 10_000, enabled: false },
    });
    expect(byId(disabled, RECOMMENDATION_IDS.rule)).toBeUndefined();
  });

  it('stops suggesting once Safe to Spend is at or below the threshold', () => {
    const saved = moneyReducer(base, {
      type: 'SAVE_RULE',
      rule: { threshold: 100_000, amount: 10_000, enabled: true },
    });
    const transfer = createTransfer(saved, 20_000, 'recommendation', RECOMMENDATION_IDS.savings);
    const after = moneyReducer(saved, { type: 'COMPLETE_TRANSFER', transfer });
    expect(byId(after, RECOMMENDATION_IDS.rule)).toBeUndefined();
  });
});
