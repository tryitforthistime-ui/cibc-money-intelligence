import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { formatDate } from '@/domain/dates';
import { formatMoney, MINUS } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, tabular, type } from '@/theme/tokens';

function Line({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={styles.line} accessible accessibilityLabel={`${label} ${value}`}>
      <Text style={[styles.lineLabel, strong && styles.strong, muted && styles.muted]}>{label}</Text>
      <Text style={[styles.lineValue, tabular, strong && styles.strong, muted && styles.muted]}>
        {value}
      </Text>
    </View>
  );
}

/** "How was this calculated?" — formula, worked numbers and every assumption. */
export function ExplainSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { forecast, state, chequing } = useMoney();
  const low = forecast.lowestPoint;
  const counted = forecast.included.filter(
    (t) => t.direction === 'expense' && t.dayIndex <= low.dayIndex,
  );
  const coveredLater = forecast.included.filter(
    (t) => t.direction === 'expense' && t.dayIndex > low.dayIndex,
  );
  const incomes = forecast.included.filter((t) => t.direction === 'income');
  const end = formatDate(forecast.endDate, 'weekdayLong');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="How was this calculated?"
      footer={<Button label="Got it" onPress={onClose} />}>
      <View style={styles.formula}>
        <Text style={styles.formulaText}>
          Safe to Spend = Current Balance {MINUS} Upcoming Expenses {MINUS} Safety Buffer
        </Text>
      </View>

      <Text style={styles.heading}>Your numbers until {formatDate(forecast.endDate, 'long')}</Text>
      <View style={styles.box}>
        <Line label="Current balance" value={formatMoney(forecast.currentBalance)} />
        {forecast.countedIncome > 0 ? (
          <Line
            label="Income that arrives before your bills"
            value={`+${formatMoney(forecast.countedIncome)}`}
          />
        ) : null}
        <Line label="Upcoming expenses" value={`${MINUS}${formatMoney(forecast.countedExpenses)}`} />
        <Line label="Safety buffer" value={`${MINUS}${formatMoney(forecast.buffer)}`} />
        <View style={styles.rule} />
        <Line label="Safe to spend" value={formatMoney(forecast.safeToSpend)} strong />
      </View>

      {counted.length > 0 ? (
        <>
          <Text style={styles.heading}>Upcoming expenses counted</Text>
          <View style={styles.box}>
            {counted.map((t) => (
              <Line
                key={t.id}
                label={`${t.name} · ${formatDate(t.date, 'short')}`}
                value={`${MINUS}${formatMoney(t.amount)}`}
              />
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.heading}>Expected income</Text>
      <View style={styles.bullets}>
        {incomes.length === 0 ? (
          <Text style={styles.bullet}>• No income is expected before {formatDate(forecast.endDate, 'short')}.</Text>
        ) : null}
        {incomes.map((t) => (
          <Text key={t.id} style={styles.bullet}>
            •{' '}
            {t.dayIndex < low.dayIndex
              ? `${t.name} (+${formatMoney(t.amount)}) on ${formatDate(t.date, 'weekdayShort')} is counted because it arrives before later expenses.`
              : `${t.name} (+${formatMoney(t.amount)}) on ${formatDate(t.date, 'weekdayShort')} isn’t counted. It arrives after the expenses it would need to cover.`}
          </Text>
        ))}
        {coveredLater.length > 0 ? (
          <Text style={styles.bullet}>
            • {coveredLater.map((t) => t.name).join(', ')} ({MINUS}
            {formatMoney(forecast.uncountedExpenses)}) comes after income arrives, so it doesn’t reduce Safe
            to Spend today.
          </Text>
        ) : null}
        <Text style={styles.bullet}>
          • Income is only included if it is forecast to arrive within this period and before the
          spending it would cover.
        </Text>
      </View>

      <Text style={styles.heading}>Assumptions</Text>
      <View style={styles.bullets}>
        {[
          `Calculation period: today (${formatDate(state.demoDate, 'weekdayLong')}) to ${end}.`,
          `Starting point: the available balance in your ${chequing.name}.`,
          `Lowest projected balance: ${formatMoney(low.balance)}${low.dayIndex >= 0 ? ` on ${formatDate(low.date, 'weekdayShort')}` : ''}. Safe to Spend keeps your buffer intact on every day of the period.`,
          'Confirmed, scheduled and predicted items are included. Items you exclude are not.',
          'Predicted amounts and dates come from your recent history and may vary.',
          'Within a day, expenses are assumed to come out before income arrives.',
          'Card purchases aren’t counted separately. Only your scheduled Visa payment is, so nothing is counted twice.',
          'Transfers between your own accounts are counted once, when money leaves chequing.',
          'Everyday spending like groceries isn’t forecast. Safe to Spend is what’s available for it.',
          `For this demo, “today” is fixed at ${formatDate(state.demoDate, 'long')} so the journey is repeatable.`,
        ].map((text) => (
          <Text key={text} style={styles.bullet}>
            • {text}
          </Text>
        ))}
      </View>
      <Text style={styles.disclaimer}>
        Safe to Spend is an estimate based on your account activity. It isn’t a guarantee.
      </Text>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  formula: {
    backgroundColor: colors.redTint,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 4,
  },
  formulaText: { ...type.callout, fontWeight: '700', color: colors.burgundy, textAlign: 'center' },
  heading: { ...type.headline, color: colors.textStrong, marginTop: 20, marginBottom: 8 },
  box: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 6 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 7 },
  lineLabel: { ...type.subhead, color: colors.text, flex: 1 },
  lineValue: { ...type.subhead, color: colors.text, fontWeight: '600' },
  strong: { fontWeight: '700', color: colors.textStrong, fontSize: 16 },
  muted: { color: colors.textTertiary },
  rule: { height: 1, backgroundColor: '#D5D5D5', marginVertical: 4 },
  bullets: { gap: 8 },
  bullet: { ...type.subhead, color: colors.text },
  disclaimer: { ...type.footnote, color: colors.textSecondary, marginTop: 18 },
});
