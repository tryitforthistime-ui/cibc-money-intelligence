import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedMoney } from '@/components/AnimatedMoney';
import { Button, type IconName } from '@/components/Button';
import { ForecastChart } from '@/components/ForecastChart';
import { OutlookStatusChip } from '@/components/StatusChip';
import { formatDate } from '@/domain/dates';
import { getOutlookStatus } from '@/domain/forecast';
import { formatMoney, MINUS } from '@/domain/money';
import { RECOMMENDATION_IDS } from '@/domain/recommendations';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';

interface MoneyOutlookCardProps {
  active: boolean;
  loading: boolean;
  updated: boolean;
  onViewOutlook: () => void;
  onSeeRecommendations: () => void;
}

function Skeleton() {
  const pulse = useSharedValue(0.45);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 650 }), -1, true));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View style={style} accessibilityLabel="Analyzing your cash flow">
      <View style={[styles.bone, { width: 110, height: 14 }]} />
      <View style={[styles.bone, { width: 150, height: 38, marginTop: 10 }]} />
      <View style={[styles.bone, { width: '100%', height: 56, marginTop: 16 }]} />
      <View style={[styles.bone, { width: '100%', height: 92, marginTop: 16 }]} />
      <Text style={styles.skeletonText}>Analyzing your cash flow…</Text>
    </Animated.View>
  );
}

function Breakdown({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.breakdownItem} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.breakdownValue, tabular]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
  );
}

function Insight({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.insight}>
      <View style={styles.insightIcon}>
        <Ionicons name={icon} size={16} color={colors.burgundy} />
      </View>
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

/** Money Outlook — replaces the blank "Insights" area of the home feed. */
export function MoneyOutlookCard({
  active,
  loading,
  updated,
  onViewOutlook,
  onSeeRecommendations,
}: MoneyOutlookCardProps) {
  const { forecast, recommendations, state, goal } = useMoney();
  const [selected, setSelected] = useState<number | null>(null);
  const status = getOutlookStatus(forecast);
  const whole = (cents: number) => formatMoney(cents, { decimals: 'auto' });

  const savingsRec = recommendations.find((r) => r.id === RECOMMENDATION_IDS.savings);
  const payday = forecast.nextPayday;
  const until = formatDate(forecast.endDate, 'long');

  const statusLine =
    status === 'below-buffer'
      ? { icon: 'warning' as const, color: colors.alert, text: 'You may dip below your buffer before payday.' }
      : status === 'tight'
        ? { icon: 'alert-circle' as const, color: colors.amber, text: 'Your cushion is small. Review what’s coming up.' }
        : {
            icon: 'checkmark-circle' as const,
            color: colors.green,
            text: payday ? 'You’re on track for your next payday.' : `You’re on track until ${until}.`,
          };

  let savingsInsight: string;
  if (savingsRec?.status === 'completed') {
    savingsInsight = `You moved ${whole(savingsRec.suggestedAmount ?? 0)} to your ${goal.name} goal. It’s now ${goal.percentLabel} funded.`;
  } else if (savingsRec && savingsRec.status !== 'dismissed') {
    savingsInsight = `You could put ${whole(savingsRec.suggestedAmount ?? 0)} toward your savings goal.`;
  } else if (!savingsRec) {
    savingsInsight = 'Savings suggestions are paused while your outlook is tight.';
  } else {
    savingsInsight = `${goal.name} is ${goal.percentLabel} funded.`;
  }

  const selectedEntry = selected !== null ? forecast.entries[selected] : undefined;
  const lowest = forecast.lowestPoint;
  const chartCaption = selectedEntry
    ? `${selected === 0 ? 'Today' : formatDate(selectedEntry.date, 'weekdayShort')}: ${formatMoney(selectedEntry.closingBalance)}${
        selectedEntry.transactions.length
          ? ` · ${selectedEntry.transactions.map((t) => t.name).join(', ')}`
          : ''
      }`
    : lowest.dayIndex >= 0
      ? `Lowest projected: ${formatMoney(lowest.balance)} on ${formatDate(lowest.date, 'short')}`
      : 'Projected balance, next 14 days';

  const bufferLabel = state.buffer === state.recommendedBuffer ? 'Recommended buffer' : 'Your buffer';

  return (
    <View style={styles.card} testID="money-outlook-card">
      {loading ? (
        <Skeleton />
      ) : (
        <Animated.View entering={FadeIn.duration(350)}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>Safe to spend</Text>
            <View style={styles.chips}>
              {updated ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.updatedChip}>
                  <Text style={styles.updatedText}>Updated</Text>
                </Animated.View>
              ) : null}
              <OutlookStatusChip status={status} />
            </View>
          </View>
          <AnimatedMoney
            value={forecast.safeToSpend}
            active={active}
            style={[styles.amount, forecast.safeToSpend < 0 && { color: colors.alert }]}
            testID="home-safe-to-spend"
          />
          <Text style={styles.until}>Until {until}</Text>

          <View style={styles.breakdown}>
            <Breakdown label="Current balance" value={whole(forecast.currentBalance)} />
            <View style={styles.breakdownDivider} />
            {forecast.countedIncome > 0 ? (
              <>
                <Breakdown label="Expected income" value={`+${whole(forecast.countedIncome)}`} />
                <View style={styles.breakdownDivider} />
              </>
            ) : null}
            <Breakdown label="Upcoming expenses" value={`${MINUS}${whole(forecast.countedExpenses)}`} />
            <View style={styles.breakdownDivider} />
            <Breakdown label={bufferLabel} value={`${MINUS}${whole(forecast.buffer)}`} />
          </View>

          <View style={styles.statusLine}>
            <Ionicons name={statusLine.icon} size={18} color={statusLine.color} />
            <Text style={styles.statusText}>{statusLine.text}</Text>
          </View>

          <View style={styles.chartBlock}>
            <Text style={[styles.chartCaption, tabular]} numberOfLines={1}>
              {chartCaption}
            </Text>
            <ForecastChart
              testID="home-forecast-chart"
              entries={forecast.entries}
              buffer={forecast.buffer}
              height={112}
              variant="compact"
              selectedIndex={selected}
              onSelectIndex={setSelected}
              lowestDayIndex={lowest.dayIndex >= 0 ? lowest.dayIndex : undefined}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.intelTitle}>Your Money Intelligence</Text>
          <Insight
            icon="receipt-outline"
            text={`${forecast.billsCount} upcoming bill${forecast.billsCount === 1 ? '' : 's'} detected.`}
          />
          <Insight
            icon="calendar-outline"
            text={
              payday
                ? `Your next payday is ${formatDate(payday.date, 'long')}.`
                : 'No payday detected in the next 14 days.'
            }
          />
          <Insight icon="trending-up-outline" text={savingsInsight} />

          <View style={styles.actions}>
            <Button label="View my outlook" onPress={onViewOutlook} testID="cta-view-outlook" />
            <Button
              label="See recommendations"
              variant="secondary"
              onPress={onSeeRecommendations}
              testID="cta-see-recommendations"
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    padding: space.md,
    boxShadow: '0 4px 18px rgba(0,0,0,0.06)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updatedChip: {
    backgroundColor: colors.redTint,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  updatedText: { fontSize: 12.5, fontWeight: '700', color: colors.red },
  eyebrow: { ...type.subhead, color: colors.textSecondary, fontWeight: '500' },
  amount: {
    fontSize: 42,
    lineHeight: 50,
    fontWeight: '700',
    color: colors.textStrong,
    letterSpacing: -1,
    marginTop: 2,
  },
  until: { ...type.subhead, color: colors.textSecondary },
  breakdown: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    marginTop: 14,
    paddingVertical: 10,
  },
  breakdownItem: { flex: 1, paddingHorizontal: 8 },
  breakdownDivider: { width: StyleSheet.hairlineWidth, backgroundColor: '#D6D6D6', marginVertical: 2 },
  breakdownValue: { fontSize: 16, fontWeight: '700', color: colors.textStrong },
  breakdownLabel: { fontSize: 12, lineHeight: 15, color: colors.textSecondary, marginTop: 2 },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  statusText: { ...type.subhead, color: colors.text, flex: 1, fontWeight: '500' },
  chartBlock: { marginTop: 14 },
  chartCaption: { ...type.footnote, color: colors.textSecondary, marginBottom: 4 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#DADADA', marginTop: 8, marginBottom: 14 },
  intelTitle: { ...type.headline, fontSize: 16, color: colors.textStrong, marginBottom: 8 },
  insight: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  insightIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F6EEF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: { ...type.subhead, color: colors.text, flex: 1 },
  actions: { gap: 10, marginTop: 16 },
  bone: { backgroundColor: '#ECECEC', borderRadius: 8 },
  skeletonText: { ...type.footnote, color: colors.textTertiary, marginTop: 12, textAlign: 'center' },
});
