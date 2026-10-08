import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedMoney } from '@/components/AnimatedMoney';
import { Button } from '@/components/Button';
import { ListRow } from '@/components/layout';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDate } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';

/** Epic 3 — Feature C: savings goal progress. */
export default function GoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, goal, savings } = useMoney();

  const contributions = [
    ...[...state.transfers].reverse().map((t) => ({
      key: t.id,
      date: t.date,
      amount: t.amount,
      label: t.source === 'rule' ? 'Smart Savings Rule' : t.source === 'recommendation' ? 'From recommendation' : 'Transfer',
      simulated: true,
    })),
    ...state.goal.pastContributions.map((c) => ({
      key: c.date,
      date: c.date,
      amount: c.amount,
      label: 'Transfer from chequing',
      simulated: false,
    })),
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="home" size={26} color={colors.red} />
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {goal.name}
        </Text>
        <AnimatedMoney value={goal.saved} style={styles.saved} testID="goal-saved" />
        <Text style={[styles.of, tabular]}>
          saved of {formatMoney(goal.target, { decimals: 'auto' })} goal
        </Text>
        <ProgressBar ratio={goal.ratio} height={14} style={styles.bar} accessibilityLabel={`${goal.name} progress`} />
        <View style={styles.barLabels}>
          <Text style={[styles.percent, tabular]} testID="goal-percent">
            {goal.percentLabel}
          </Text>
          <Text style={[styles.remaining, tabular]}>
            {formatMoney(goal.remaining, { decimals: 'auto' })} to go
          </Text>
        </View>
      </View>

      <View style={styles.linked}>
        <Ionicons name="link-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.linkedText}>
          Linked to {savings.productName} ···{savings.mask}
        </Text>
      </View>

      <Button
        label="Move money to this goal"
        icon="arrow-up-circle-outline"
        onPress={() => router.push({ pathname: '/transfer', params: { source: 'manual' } })}
        style={styles.cta}
      />

      <View style={styles.rules}>
        <ListRow
          icon="flash-outline"
          title="Smart Savings Rules"
          subtitle={state.rule.saved ? (state.rule.enabled ? 'On' : 'Off') : 'Not set up'}
          onPress={() => router.push('/savings-rules')}
        />
      </View>

      <Text style={styles.section}>Recent contributions</Text>
      <View style={styles.list}>
        {contributions.map((c, i) => (
          <View key={c.key} style={[styles.row, i > 0 && styles.rowBorder]}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{c.label}</Text>
              <Text style={styles.rowSub}>
                {formatDate(c.date, 'weekdayShort')}
                {c.simulated ? ' · Simulated' : ''}
              </Text>
            </View>
            <Text style={[styles.rowAmount, tabular]}>{formatMoney(c.amount, { sign: 'always' })}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingTop: 4 },
  hero: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, alignItems: 'center' },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...type.title3, color: colors.textStrong, marginTop: 10 },
  saved: { fontSize: 40, lineHeight: 48, fontWeight: '700', color: colors.textStrong, marginTop: 8, letterSpacing: -1 },
  of: { ...type.subhead, color: colors.textSecondary },
  bar: { marginTop: 18 },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 8 },
  percent: { ...type.headline, color: colors.red },
  remaining: { ...type.subhead, color: colors.textSecondary },
  linked: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 },
  linkedText: { ...type.footnote, color: colors.textSecondary },
  cta: { marginTop: 18 },
  rules: { marginTop: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: '#E4E4E4', overflow: 'hidden' },
  section: { ...type.title3, color: colors.textStrong, marginTop: 26, marginBottom: 8 },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#D3D3D3' },
  rowTitle: { ...type.subhead, color: colors.text, fontWeight: '600' },
  rowSub: { ...type.footnote, color: colors.textSecondary },
  rowAmount: { ...type.callout, fontWeight: '600', color: colors.green },
});
