import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { buildForecast, getAccount, getChequing } from '@/domain/forecast';
import { getGoalProgress } from '@/domain/goals';
import { createInitialState } from '@/domain/mockData';
import { buildRecommendations } from '@/domain/recommendations';
import { moneyReducer, type MoneyAction } from '@/domain/reducer';
import type { Account, Forecast, MoneyState, Recommendation } from '@/domain/types';
import type { GoalProgress } from '@/domain/goals';

interface MoneyContextValue {
  state: MoneyState;
  dispatch: (action: MoneyAction) => void;
  forecast: Forecast;
  recommendations: Recommendation[];
  goal: GoalProgress;
  chequing: Account;
  savings: Account;
}

const MoneyContext = createContext<MoneyContextValue | null>(null);

/**
 * Session-scoped store. Everything on screen is derived from one reducer
 * state, so balances, forecast, recommendations and goal always agree.
 * State lives in memory: relaunching the app (or "Reset demo") starts fresh.
 */
export function MoneyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(moneyReducer, undefined, createInitialState);

  const value = useMemo<MoneyContextValue>(() => {
    const forecast = buildForecast(state);
    return {
      state,
      dispatch,
      forecast,
      recommendations: buildRecommendations(state, forecast),
      goal: getGoalProgress(state),
      chequing: getChequing(state),
      savings: getAccount(state, state.goal.accountId),
    };
  }, [state]);

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney(): MoneyContextValue {
  const value = useContext(MoneyContext);
  if (!value) throw new Error('useMoney must be used inside <MoneyProvider>');
  return value;
}
