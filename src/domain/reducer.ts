import { createInitialState } from './mockData';
import { applyTransfer } from './transfers';
import type { Cents, ISODate, MoneyState, SavingsRule, SimulatedTransfer } from './types';

export type MoneyAction =
  | { type: 'EDIT_TRANSACTION'; id: string; amount: Cents; date: ISODate }
  | { type: 'RESET_TRANSACTION'; id: string }
  | { type: 'EXCLUDE_TRANSACTION'; id: string }
  | { type: 'INCLUDE_TRANSACTION'; id: string }
  | { type: 'SET_BUFFER'; amount: Cents }
  | { type: 'SET_VIEW_DAYS'; days: 7 | 14 }
  | { type: 'DISMISS_RECOMMENDATION'; id: string }
  | { type: 'RESTORE_RECOMMENDATION'; id: string }
  | { type: 'RESTORE_DISMISSED' }
  | { type: 'MARK_RECOMMENDATION_USEFUL'; id: string }
  | { type: 'COMPLETE_TRANSFER'; transfer: SimulatedTransfer }
  | { type: 'SAVE_RULE'; rule: Pick<SavingsRule, 'threshold' | 'amount' | 'enabled'> }
  | { type: 'RESET_DEMO' };

export function moneyReducer(state: MoneyState, action: MoneyAction): MoneyState {
  switch (action.type) {
    case 'EDIT_TRANSACTION': {
      const original = state.recurring.find((t) => t.id === action.id);
      if (!original || action.amount <= 0) return state;
      const current = state.overrides[action.id] ?? {};
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.id]: {
            ...current,
            amount: action.amount === original.amount ? undefined : action.amount,
            date: action.date === original.date ? undefined : action.date,
          },
        },
      };
    }
    case 'RESET_TRANSACTION': {
      const current = state.overrides[action.id];
      if (!current) return state;
      return {
        ...state,
        overrides: { ...state.overrides, [action.id]: { excluded: current.excluded } },
      };
    }
    case 'EXCLUDE_TRANSACTION':
    case 'INCLUDE_TRANSACTION': {
      const current = state.overrides[action.id] ?? {};
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [action.id]: { ...current, excluded: action.type === 'EXCLUDE_TRANSACTION' },
        },
      };
    }
    case 'SET_BUFFER':
      return action.amount < 0 ? state : { ...state, buffer: action.amount };
    case 'SET_VIEW_DAYS':
      return { ...state, viewDays: action.days };
    case 'DISMISS_RECOMMENDATION':
      return {
        ...state,
        recommendationFeedback: { ...state.recommendationFeedback, [action.id]: 'dismissed' },
      };
    case 'MARK_RECOMMENDATION_USEFUL':
      return {
        ...state,
        recommendationFeedback: { ...state.recommendationFeedback, [action.id]: 'useful' },
      };
    case 'RESTORE_RECOMMENDATION': {
      const feedback = { ...state.recommendationFeedback };
      delete feedback[action.id];
      return { ...state, recommendationFeedback: feedback };
    }
    case 'RESTORE_DISMISSED':
      return {
        ...state,
        recommendationFeedback: Object.fromEntries(
          Object.entries(state.recommendationFeedback).filter(([, v]) => v !== 'dismissed'),
        ),
      };
    case 'COMPLETE_TRANSFER':
      return applyTransfer(state, action.transfer);
    case 'SAVE_RULE':
      return { ...state, rule: { ...state.rule, ...action.rule, saved: true } };
    case 'RESET_DEMO':
      return createInitialState();
  }
}
