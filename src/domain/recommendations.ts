import { formatDate } from './dates';
import { getLowPointDrivers, getUpcomingTransactions } from './forecast';
import { getGoalProgress, goalProgressFor } from './goals';
import { formatMoney } from './money';
import { suggestSavingsAmount } from './transfers';
import type { Cents, Forecast, MoneyState, Recommendation, RecommendationStatus } from './types';

export const RECOMMENDATION_IDS = {
  shortfall: 'rec-shortfall',
  savings: 'rec-savings',
  subscription: 'rec-subscription',
  rule: 'rec-rule',
} as const;

const money = (cents: Cents) => formatMoney(cents);
const whole = (cents: Cents) => formatMoney(cents, { decimals: 'auto' });

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  return `${day}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th'}`;
}

function feedbackStatus(state: MoneyState, id: string): RecommendationStatus {
  return state.recommendationFeedback[id] ?? 'active';
}

/**
 * Turns the forecast into explainable recommendations.
 *
 * Guardrails:
 * - No recommendation promises an outcome; wording stays conditional.
 * - A transfer is only suggested when it is no larger than Safe to Spend,
 *   so it can never push the projected balance below the client's buffer.
 * - Dismissed recommendations are returned with status "dismissed" so the UI
 *   can keep them hidden for the session (and offer to restore them).
 */
export function buildRecommendations(state: MoneyState, forecast: Forecast): Recommendation[] {
  const recs: Recommendation[] = [];
  const sts = forecast.safeToSpend;
  const until = forecast.nextPayday ? 'payday' : formatDate(forecast.endDate, 'short');
  const goal = getGoalProgress(state);

  // A — Upcoming shortfall / lower than usual
  const low = forecast.lowestPoint;
  const drivers = getLowPointDrivers(forecast);
  const driverText = drivers
    .map((t) => `${t.name} (${money(t.amount)}, ${formatDate(t.date, 'short')})`)
    .join(' and ');
  const shortfallReasoning = [
    `Lowest projected balance: ${money(low.balance)} on ${formatDate(low.date, 'weekdayShort')}.`,
    `Your usual lowest balance before payday: ${money(state.history.usualLowBeforePayday)} (average of your last 3 pay periods).`,
    ...(driverText ? [`Biggest expenses before then: ${driverText}.`] : []),
    `Safety buffer you chose: ${money(forecast.buffer)}.`,
  ];
  if (sts < 0) {
    recs.push({
      id: RECOMMENDATION_IDS.shortfall,
      type: 'shortfall',
      severity: 'alert',
      eyebrow: 'UPCOMING SHORTFALL',
      title: 'Heads up: your balance may be lower than usual.',
      body: `Your projected balance could fall to ${money(low.balance)} on ${formatDate(low.date, 'short')}, below your preferred ${whole(forecast.buffer)} buffer before ${until}.`,
      reasoning: [
        ...shortfallReasoning,
        `Upcoming expenses are ${money(-sts)} more than what's available above your buffer, before any everyday spending.`,
      ],
      ctaLabel: 'Review upcoming expenses',
      status: feedbackStatus(state, RECOMMENDATION_IDS.shortfall),
      relatedTransactionIds: drivers.map((t) => t.id),
    });
  } else if (low.balance < state.history.usualLowBeforePayday) {
    recs.push({
      id: RECOMMENDATION_IDS.shortfall,
      type: 'shortfall',
      severity: 'watch',
      eyebrow: 'UPCOMING SHORTFALL',
      title: 'Heads up: your balance may be lower than usual.',
      body: `Your projected balance could fall below your preferred ${whole(forecast.buffer)} buffer before ${until} if you spend more than ${whole(sts)}.`,
      reasoning: shortfallReasoning,
      ctaLabel: 'Review upcoming expenses',
      status: feedbackStatus(state, RECOMMENDATION_IDS.shortfall),
      relatedTransactionIds: drivers.map((t) => t.id),
    });
  }

  // B — Savings opportunity
  const savingsTransfer = state.transfers.find(
    (t) => t.recommendationId === RECOMMENDATION_IDS.savings,
  );
  if (savingsTransfer) {
    recs.push({
      id: RECOMMENDATION_IDS.savings,
      type: 'savings',
      severity: 'opportunity',
      eyebrow: 'SAVINGS OPPORTUNITY',
      title: `You moved ${whole(savingsTransfer.amount)} toward your goal.`,
      body: `${goal.name} is now ${goal.percentLabel} funded, and your Money Outlook has been updated.`,
      reasoning: [
        `Transfer of ${money(savingsTransfer.amount)} confirmed on ${formatDate(savingsTransfer.date, 'short')} (simulated).`,
        `Safe to Spend is now ${money(sts)} and your ${whole(forecast.buffer)} buffer is untouched.`,
      ],
      ctaLabel: 'View savings goal',
      status: 'completed',
      suggestedAmount: savingsTransfer.amount,
      relatedTransactionIds: [],
      outcome: `Completed · Confirmation ${savingsTransfer.confirmationNumber}`,
    });
  } else {
    const suggestion = suggestSavingsAmount(sts);
    if (suggestion > 0) {
      const after = goalProgressFor(goal.name, goal.saved + suggestion, goal.target);
      recs.push({
        id: RECOMMENDATION_IDS.savings,
        type: 'savings',
        severity: 'opportunity',
        eyebrow: 'SAVINGS OPPORTUNITY',
        title: `You may have room to save ${whole(suggestion)}.`,
        body: `Based on your projected cash flow, you could transfer ${whole(suggestion)} toward your ${goal.name} goal while maintaining your selected buffer.`,
        reasoning: [
          `Safe to Spend until ${formatDate(forecast.endDate, 'short')}: ${money(sts)}.`,
          `After moving ${whole(suggestion)}, you'd still have ${money(sts - suggestion)} safe to spend and your ${whole(forecast.buffer)} buffer stays untouched.`,
          'We suggest up to 20% of Safe to Spend, rounded down to the nearest $50, so most of your cushion stays available.',
          `${goal.name}: ${goal.percentLabel} → ${after.percentLabel} of ${whole(goal.target)}.`,
        ],
        ctaLabel: `Move ${whole(suggestion)} to savings`,
        status: feedbackStatus(state, RECOMMENDATION_IDS.savings),
        suggestedAmount: suggestion,
        relatedTransactionIds: [],
      });
    }
  }

  // Rule-based suggestion (Epic 3, Feature B) — only once the client saves an enabled rule.
  const rule = state.rule;
  if (rule.saved && rule.enabled) {
    const ruleTransfer = state.transfers.find((t) => t.recommendationId === RECOMMENDATION_IDS.rule);
    if (ruleTransfer) {
      recs.push({
        id: RECOMMENDATION_IDS.rule,
        type: 'rule',
        severity: 'opportunity',
        eyebrow: 'SMART SAVINGS RULE',
        title: `Your rule moved ${whole(ruleTransfer.amount)} to savings.`,
        body: `You confirmed the suggestion from your Smart Savings Rule. ${goal.name} is now ${goal.percentLabel} funded.`,
        reasoning: [`Confirmed on ${formatDate(ruleTransfer.date, 'short')} (simulated).`],
        ctaLabel: 'View savings goal',
        status: 'completed',
        suggestedAmount: ruleTransfer.amount,
        relatedTransactionIds: [],
        outcome: `Completed · Confirmation ${ruleTransfer.confirmationNumber}`,
      });
    } else if (sts > rule.threshold && rule.amount <= sts) {
      recs.push({
        id: RECOMMENDATION_IDS.rule,
        type: 'rule',
        severity: 'opportunity',
        eyebrow: 'SMART SAVINGS RULE',
        title: `Your rule found ${whole(rule.amount)} to save.`,
        body: `Your projected balance is above ${whole(rule.threshold)} after upcoming expenses and your safety buffer, so your rule suggests moving ${whole(rule.amount)} to ${goal.name}.`,
        reasoning: [
          `Safe to Spend: ${money(sts)} (your rule's threshold: ${money(rule.threshold)}).`,
          `After moving ${whole(rule.amount)}: ${money(sts - rule.amount)} safe to spend; your buffer stays untouched.`,
          'Rules only suggest. You review and confirm every transfer.',
        ],
        ctaLabel: `Move ${whole(rule.amount)} to savings`,
        status: feedbackStatus(state, RECOMMENDATION_IDS.rule),
        suggestedAmount: rule.amount,
        relatedTransactionIds: [],
      });
    }
  }

  // C — Subscription insight
  const subscription = getUpcomingTransactions(state).find((t) => t.kind === 'subscription');
  if (subscription) {
    const status = feedbackStatus(state, RECOMMENDATION_IDS.subscription);
    const chargeDay = Number(subscription.originalDate.slice(8, 10));
    recs.push({
      id: RECOMMENDATION_IDS.subscription,
      type: 'subscription',
      severity: 'insight',
      eyebrow: 'SUBSCRIPTION INSIGHT',
      title: 'Review a recurring expense',
      body: `We detected a ${money(subscription.amount)} monthly subscription that you may want to review.`,
      reasoning: [
        `${subscription.merchant} has charged ${money(subscription.originalAmount)} on the ${ordinal(chargeDay)} of each month for ${subscription.history.length} months.`,
        `That's about ${money(subscription.amount * 12)} a year.`,
        `Next expected charge: ${formatDate(subscription.date, 'weekdayShort')}.`,
      ],
      ctaLabel: 'Review subscription',
      status,
      relatedTransactionIds: [subscription.id],
      outcome: status === 'useful' ? 'Marked as useful. Thanks for the feedback.' : undefined,
    });
  }

  return recs;
}

/** Recommendations the client hasn't dismissed. */
export function visibleRecommendations(recs: Recommendation[]): Recommendation[] {
  return recs.filter((r) => r.status !== 'dismissed');
}
