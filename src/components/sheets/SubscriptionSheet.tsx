import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { InfoNote } from '@/components/layout';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/domain/dates';
import { getUpcomingTransactions } from '@/domain/forecast';
import { formatMoney } from '@/domain/money';
import { RECOMMENDATION_IDS } from '@/domain/recommendations';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, tabular, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

export function SubscriptionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch, recommendations } = useMoney();
  const toast = useToast();
  const tx = getUpcomingTransactions(state).find((t) => t.kind === 'subscription');
  const rec = recommendations.find((r) => r.id === RECOMMENDATION_IDS.subscription);
  if (!tx || !rec) return null;

  const markUseful = () => {
    dispatch({ type: 'MARK_RECOMMENDATION_USEFUL', id: rec.id });
    haptics.success();
    onClose();
    toast({ message: 'Thanks. We’ll show more insights like this.', icon: 'thumbs-up' });
  };

  const dismiss = () => {
    dispatch({ type: 'DISMISS_RECOMMENDATION', id: rec.id });
    haptics.press();
    onClose();
    toast({
      message: 'Recommendation dismissed.',
      icon: 'eye-off-outline',
      actionLabel: 'Undo',
      onAction: () => dispatch({ type: 'RESTORE_RECOMMENDATION', id: rec.id }),
    });
  };

  const history = [...tx.history].reverse();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Review subscription"
      footer={
        <>
          <Button
            label={rec.status === 'useful' ? 'Marked as useful' : 'Mark as useful'}
            icon={rec.status === 'useful' ? 'checkmark' : 'thumbs-up-outline'}
            variant="secondary"
            onPress={markUseful}
            disabled={rec.status === 'useful'}
            testID="subscription-useful"
          />
          <Button label="Dismiss recommendation" variant="tertiary" onPress={dismiss} testID="subscription-dismiss" />
        </>
      }>
      <View style={styles.hero}>
        <Text style={styles.merchant}>{tx.merchant}</Text>
        <Text style={[styles.amount, tabular]}>
          {formatMoney(tx.amount)}
          <Text style={styles.per}> / month</Text>
        </Text>
        <Text style={styles.meta}>
          Next charge {formatDate(tx.date, 'weekdayShort')} · CIBC Smart Account
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, tabular]}>{formatMoney(tx.amount * 12)}</Text>
          <Text style={styles.statLabel}>Per year</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, tabular]}>{tx.history.length} months</Text>
          <Text style={styles.statLabel}>Charged in a row</Text>
        </View>
      </View>

      <Text style={styles.label}>Recent charges</Text>
      <View style={styles.history}>
        {history.slice(0, 4).map((h) => (
          <View key={h.date} style={styles.row}>
            <Text style={styles.rowDate}>{formatDate(h.date, 'weekdayShort')}</Text>
            <Text style={[styles.rowAmount, tabular]}>{formatMoney(-h.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <InfoNote>
          Still using it? No action needed. To cancel, contact {tx.merchant} directly. We never cancel
          subscriptions or move money on your behalf.
        </InfoNote>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 8 },
  merchant: { ...type.subhead, color: colors.textSecondary },
  amount: { fontSize: 34, fontWeight: '700', color: colors.textStrong, marginTop: 4 },
  per: { fontSize: 17, fontWeight: '500', color: colors.textSecondary },
  meta: { ...type.footnote, color: colors.textSecondary, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 14 },
  stat: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12 },
  statValue: { ...type.headline, color: colors.textStrong },
  statLabel: { ...type.footnote, color: colors.textSecondary, marginTop: 2 },
  label: { ...type.headline, fontSize: 15, color: colors.textStrong, marginTop: 18, marginBottom: 8 },
  history: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  rowDate: { ...type.subhead, color: colors.textSecondary },
  rowAmount: { ...type.subhead, fontWeight: '600', color: colors.text },
  note: { marginTop: 16 },
});
