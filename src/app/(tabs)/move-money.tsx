import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListRow, TabScreenHeader, useTabBarSpace } from '@/components/layout';
import { formatDate } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';

export default function MoveMoneyScreen() {
  const router = useRouter();
  const bottomSpace = useTabBarSpace();
  const { state, goal, forecast, savings } = useMoney();
  const ruleStatus = !state.rule.saved ? 'Not set up' : state.rule.enabled ? 'On' : 'Off';

  return (
    <View style={styles.screen}>
      <TabScreenHeader title="Move money" />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <Text style={styles.section}>SAVE TOWARD YOUR GOAL</Text>
        <View style={styles.group}>
          <ListRow
            icon="swap-horizontal"
            title="Transfer to savings"
            subtitle={`To ${savings.name} · ${formatMoney(forecast.safeToSpend, { decimals: 'auto' })} safe to spend`}
            onPress={() => router.push({ pathname: '/transfer', params: { source: 'manual' } })}
            testID="row-transfer"
          />
          <View style={styles.inset} />
          <ListRow
            icon="flash-outline"
            title="Smart Savings Rules"
            subtitle="Suggest a transfer when there’s room"
            value={ruleStatus}
            onPress={() => router.push('/savings-rules')}
          />
          <View style={styles.inset} />
          <ListRow
            icon="home-outline"
            title={goal.name}
            subtitle={`${goal.percentLabel} of ${formatMoney(goal.target, { decimals: 'auto' })}`}
            onPress={() => router.push('/goal')}
          />
        </View>

        <Text style={styles.section}>SIMULATED TRANSFERS THIS SESSION</Text>
        <View style={[styles.group, styles.padded]}>
          {state.transfers.length === 0 ? (
            <Text style={styles.empty}>No transfers yet. Try the savings recommendation on Home.</Text>
          ) : (
            [...state.transfers].reverse().map((t) => (
              <View key={t.id} style={styles.transfer}>
                <View style={styles.flex}>
                  <Text style={styles.transferTitle}>To {savings.name}</Text>
                  <Text style={styles.transferSub}>
                    {formatDate(t.date, 'short')} · {t.confirmationNumber}
                  </Text>
                </View>
                <Text style={[styles.transferAmount, tabular]}>{formatMoney(t.amount)}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.note}>
          Interac e-Transfer, bill payments and other money movement aren’t part of this concept
          prototype.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  section: {
    ...type.section,
    fontSize: 13,
    color: '#2F2F2F',
    paddingHorizontal: space.md,
    marginTop: 26,
    marginBottom: 10,
  },
  group: {
    marginHorizontal: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    overflow: 'hidden',
  },
  padded: { padding: 14, gap: 12 },
  inset: { height: StyleSheet.hairlineWidth, backgroundColor: '#DADADA', marginLeft: 66 },
  empty: { ...type.subhead, color: colors.textSecondary },
  transfer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  transferTitle: { ...type.subhead, color: colors.text, fontWeight: '600' },
  transferSub: { ...type.footnote, color: colors.textSecondary },
  transferAmount: { ...type.callout, fontWeight: '600', color: colors.textStrong },
  note: { ...type.footnote, color: colors.textTertiary, paddingHorizontal: space.md, marginTop: 18 },
});
