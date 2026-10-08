import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedMoney } from '@/components/AnimatedMoney';
import { Button } from '@/components/Button';
import { ForecastChart } from '@/components/ForecastChart';
import { InfoNote } from '@/components/layout';
import { SegmentedControl } from '@/components/SegmentedControl';
import { BufferSheet } from '@/components/sheets/BufferSheet';
import { EditTransactionSheet } from '@/components/sheets/EditTransactionSheet';
import { ExplainSheet } from '@/components/sheets/ExplainSheet';
import {
  OutlookStatusChip,
  TRANSACTION_STATUS_COPY,
  TransactionStatusChip,
} from '@/components/StatusChip';
import { TransactionRow } from '@/components/TransactionRow';
import { formatDate } from '@/domain/dates';
import {
  entriesForView,
  getLowPointDrivers,
  getOutlookStatus,
  getUpcomingTransactions,
} from '@/domain/forecast';
import { formatDirectional, formatMoney, MINUS } from '@/domain/money';
import type { TransactionStatus } from '@/domain/types';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';

export default function OutlookScreen() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { state, forecast, dispatch } = useMoney();
  const [selected, setSelected] = useState<number | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [bufferOpen, setBufferOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const listY = useRef(0);
  const didAutoScroll = useRef(false);

  const reviewingShortfall = focus === 'shortfall';
  const drivers = useMemo(
    () => (reviewingShortfall ? getLowPointDrivers(forecast).map((t) => t.id) : []),
    [reviewingShortfall, forecast],
  );

  const viewDays = state.viewDays;
  const entries = entriesForView(forecast, viewDays);
  const visibleTx = forecast.included.filter((t) => t.dayIndex <= viewDays);
  const laterTx = forecast.included.filter((t) => t.dayIndex > viewDays);
  const laterNet = laterTx.reduce((s, t) => s + (t.direction === 'income' ? t.amount : -t.amount), 0);
  const status = getOutlookStatus(forecast);
  const low = forecast.lowestPoint;
  const editTx = getUpcomingTransactions(state).find((t) => t.id === editId);

  const setViewDays = (days: 7 | 14) => {
    setSelected(null);
    dispatch({ type: 'SET_VIEW_DAYS', days });
  };

  // Coming from the shortfall recommendation: scroll to the highlighted expenses.
  const onListLayout = (y: number) => {
    listY.current = y;
    if (reviewingShortfall && !didAutoScroll.current) {
      didAutoScroll.current = true;
      setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true }), 500);
    }
  };

  const openEdit = (id: string) => {
    setEditId(id);
    setEditOpen(true);
  };

  const selectedEntry = selected !== null ? entries[selected] : undefined;
  const lowestEntry = low.dayIndex >= 0 ? forecast.entries[low.dayIndex] : undefined;
  const readoutEntry = selectedEntry ?? lowestEntry;

  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        testID="outlook-scroll">
        {reviewingShortfall ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.banner}>
            <InfoNote icon="alert-circle-outline" tone="warning">
              Reviewing your upcoming expenses. The highlighted items bring your balance to its lowest point
              {lowestEntry ? ` on ${formatDate(lowestEntry.date, 'weekdayShort')}` : ''}.
            </InfoNote>
          </Animated.View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>Safe to spend</Text>
            <OutlookStatusChip status={status} />
          </View>
          <AnimatedMoney
            value={forecast.safeToSpend}
            active={focused}
            style={[styles.heroAmount, forecast.safeToSpend < 0 && { color: colors.alert }]}
            testID="outlook-safe-to-spend"
          />
          <Text style={styles.heroUntil}>
            Until {formatDate(forecast.endDate, 'weekdayLong')}
            {forecast.nextPayday && forecast.nextPayday.date === forecast.endDate ? ' (payday)' : ''}
          </Text>
          <Text style={[styles.equation, tabular]} accessibilityLabel="Safe to spend equals current balance minus upcoming expenses minus safety buffer">
            {formatMoney(forecast.currentBalance, { decimals: 'auto' })}
            {forecast.countedIncome > 0 ? ` + ${formatMoney(forecast.countedIncome, { decimals: 'auto' })}` : ''}
            {` ${MINUS} ${formatMoney(forecast.countedExpenses, { decimals: 'auto' })} ${MINUS} ${formatMoney(forecast.buffer, { decimals: 'auto' })} = ${formatMoney(forecast.safeToSpend, { decimals: 'auto' })}`}
          </Text>
          <Pressable
            onPress={() => setExplainOpen(true)}
            style={styles.explain}
            accessibilityRole="button"
            testID="how-calculated">
            <Ionicons name="information-circle-outline" size={20} color={colors.red} />
            <Text style={styles.explainText}>How was this calculated?</Text>
          </Pressable>
        </View>

        <SegmentedControl
          accessibilityLabel="Forecast range"
          options={[
            { value: 7, label: '7 days' },
            { value: 14, label: '14 days' },
          ]}
          value={viewDays}
          onChange={(days) => setViewDays(days as 7 | 14)}
        />

        <View style={styles.chartCard}>
          <View style={styles.readout} accessibilityLiveRegion="polite">
            {readoutEntry ? (
              <>
                <Text style={styles.readoutLabel}>
                  {selectedEntry
                    ? selectedEntry.dayIndex === 0
                      ? 'Today'
                      : formatDate(selectedEntry.date, 'weekdayShort')
                    : `Lowest point · ${formatDate(readoutEntry.date, 'weekdayShort')}`}
                </Text>
                <Text style={[styles.readoutValue, tabular]}>
                  {formatMoney(selectedEntry ? selectedEntry.closingBalance : low.balance)}
                </Text>
                <Text style={styles.readoutTx} numberOfLines={2}>
                  {readoutEntry.transactions.length > 0
                    ? readoutEntry.transactions
                        .map((t) => `${t.name} ${formatDirectional(t.amount, t.direction)}`)
                        .join(' · ')
                    : 'No scheduled or predicted activity'}
                </Text>
              </>
            ) : (
              <Text style={styles.readoutLabel}>Tap or drag the chart to see each day.</Text>
            )}
          </View>
          <ForecastChart
            testID="outlook-chart"
            entries={entries}
            buffer={forecast.buffer}
            height={210}
            variant="detailed"
            selectedIndex={selected}
            onSelectIndex={setSelected}
            lowestDayIndex={low.dayIndex >= 0 && low.dayIndex <= viewDays ? low.dayIndex : undefined}
            highlightDayIndexes={forecast.included.filter((t) => drivers.includes(t.id)).map((t) => t.dayIndex)}
          />
          <View style={styles.legend}>
            <LegendItem swatch={<View style={styles.legendLine} />} label="Projected balance" />
            <LegendItem swatch={<View style={styles.legendDashed} />} label="Safety buffer" />
            <LegendItem swatch={<View style={[styles.legendDot, { backgroundColor: colors.green }]} />} label="Income" />
            <LegendItem swatch={<View style={[styles.legendDot, styles.legendHollow]} />} label="Bill or payment" />
          </View>
        </View>

        <View style={styles.stats}>
          <Stat label="Expected income" value={formatMoney(forecast.totalIncome, { decimals: 'auto', sign: 'always' })} />
          <Stat label="Upcoming expenses" value={`${MINUS}${formatMoney(forecast.totalExpenses, { decimals: 'auto' })}`} />
          <Stat label="Lowest balance" value={formatMoney(low.balance, { decimals: 'auto' })} />
        </View>

        <Pressable
          style={styles.bufferRow}
          onPress={() => setBufferOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Safety buffer ${formatMoney(forecast.buffer, { decimals: 'auto' })}. Change`}
          testID="change-buffer">
          <View style={styles.bufferIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.burgundy} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.bufferTitle}>Safety buffer</Text>
            <Text style={styles.bufferSub}>
              {formatMoney(forecast.buffer, { decimals: 'auto' })}
              {state.buffer === state.recommendedBuffer ? ' · Recommended' : ' · Set by you'}
            </Text>
          </View>
          <Text style={styles.change}>Change</Text>
        </Pressable>

        <View onLayout={(e) => onListLayout(e.nativeEvent.layout.y)}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Upcoming activity
            </Text>
            <Pressable
              onPress={() => setLegendOpen((v) => !v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ expanded: legendOpen }}>
              <Text style={styles.link}>{legendOpen ? 'Hide labels' : 'What do labels mean?'}</Text>
            </Pressable>
          </View>
          {legendOpen ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.statusLegend}>
              {(['confirmed', 'scheduled', 'predicted'] as TransactionStatus[]).map((s) => (
                <View key={s} style={styles.statusLegendRow}>
                  <TransactionStatusChip status={s} small />
                  <Text style={styles.statusLegendText}>{TRANSACTION_STATUS_COPY[s]}</Text>
                </View>
              ))}
            </Animated.View>
          ) : null}
          <Text style={styles.listHint}>Tap a predicted item to edit or exclude it.</Text>

          <View style={styles.list}>
            {visibleTx.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                today={state.demoDate}
                onPress={() => openEdit(tx.id)}
                highlighted={drivers.includes(tx.id)}
              />
            ))}
          </View>

          {laterTx.length > 0 ? (
            <Pressable
              style={styles.later}
              onPress={() => setViewDays(14)}
              accessibilityRole="button">
              <Text style={styles.laterText}>
                {laterTx.length} more until {formatDate(forecast.endDate, 'short')} (
                {formatMoney(laterNet, { sign: 'always' })}). Show 14 days
              </Text>
            </Pressable>
          ) : null}

          {forecast.excluded.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, styles.excludedTitle]}>Excluded by you</Text>
              <View style={styles.list}>
                {forecast.excluded.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    today={state.demoDate}
                    onPress={() => openEdit(tx.id)}
                    dimmed
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.assumptions}>
          <Text style={styles.sectionTitle}>Forecast assumptions</Text>
          {[
            `Starts from your available chequing balance of ${formatMoney(forecast.currentBalance)}.`,
            'Includes confirmed, scheduled and predicted activity you haven’t excluded.',
            'Income only counts if it arrives before the spending it would cover.',
            `Keeps your ${formatMoney(forecast.buffer, { decimals: 'auto' })} safety buffer untouched.`,
          ].map((line) => (
            <View key={line} style={styles.assumptionRow}>
              <Ionicons name="checkmark" size={16} color={colors.green} />
              <Text style={styles.assumption}>{line}</Text>
            </View>
          ))}
          <Button
            label="How was this calculated?"
            variant="secondary"
            icon="calculator-outline"
            onPress={() => setExplainOpen(true)}
            style={styles.assumptionButton}
          />
        </View>

        <Text style={styles.disclaimer}>
          Forecasts are estimates based on your account history and scheduled activity. They aren’t
          guaranteed. Demo date: {formatDate(state.demoDate, 'weekdayLong')}.
        </Text>
      </ScrollView>

      <ExplainSheet visible={explainOpen} onClose={() => setExplainOpen(false)} />
      <BufferSheet visible={bufferOpen} onClose={() => setBufferOpen(false)} />
      <EditTransactionSheet tx={editTx} visible={editOpen} onClose={() => setEditOpen(false)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={[styles.statValue, tabular]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <View style={styles.legendItem}>
      {swatch}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingTop: 4 },
  banner: { marginBottom: 12 },
  hero: { paddingBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { ...type.callout, color: colors.textSecondary, fontWeight: '500' },
  heroAmount: { fontSize: 48, lineHeight: 56, fontWeight: '700', letterSpacing: -1.2, color: colors.textStrong },
  heroUntil: { ...type.subhead, color: colors.textSecondary },
  equation: { ...type.footnote, color: colors.textSecondary, marginTop: 8 },
  explain: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, marginTop: 4 },
  explainText: { ...type.callout, color: colors.red, fontWeight: '600' },
  chartCard: {
    marginTop: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  readout: { minHeight: 66, paddingHorizontal: 4, marginBottom: 4 },
  readoutLabel: { ...type.footnote, color: colors.textSecondary, fontWeight: '600' },
  readoutValue: { ...type.title3, color: colors.textStrong, marginTop: 1 },
  readoutTx: { ...type.footnote, color: colors.text, marginTop: 1 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 4, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontSize: 11.5, color: colors.textSecondary },
  legendLine: { width: 14, height: 3, borderRadius: 2, backgroundColor: colors.chartLine },
  legendDashed: { width: 14, height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.chartBuffer },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendHollow: { borderWidth: 2, borderColor: colors.chartLine, backgroundColor: colors.background },
  stats: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: 12 },
  statValue: { fontSize: 17, fontWeight: '700', color: colors.textStrong },
  statLabel: { fontSize: 12, lineHeight: 15, color: colors.textSecondary, marginTop: 2 },
  bufferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    minHeight: 60,
  },
  bufferIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6EEF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bufferTitle: { ...type.callout, color: colors.text, fontWeight: '600' },
  bufferSub: { ...type.footnote, color: colors.textSecondary },
  change: { ...type.callout, color: colors.red, fontWeight: '600' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  sectionTitle: { ...type.title3, color: colors.textStrong },
  link: { ...type.footnote, color: colors.red, fontWeight: '600' },
  statusLegend: { marginTop: 10, gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12 },
  statusLegendRow: { gap: 4 },
  statusLegendText: { ...type.footnote, color: colors.text },
  listHint: { ...type.footnote, color: colors.textSecondary, marginTop: 6, marginBottom: 6 },
  list: { marginHorizontal: -12, gap: 2 },
  later: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
  laterText: { ...type.subhead, color: colors.red, fontWeight: '600' },
  excludedTitle: { marginTop: 22, marginBottom: 4 },
  assumptions: {
    marginTop: 26,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
  },
  assumptionRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  assumption: { ...type.subhead, color: colors.text, flex: 1 },
  assumptionButton: { marginTop: 8 },
  disclaimer: { ...type.footnote, color: colors.textTertiary, marginTop: 18 },
});
