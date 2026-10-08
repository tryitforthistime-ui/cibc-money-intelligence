import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { formatRelativeDay } from '@/domain/dates';
import { formatDirectional } from '@/domain/money';
import type { TransactionCategory, UpcomingTransaction } from '@/domain/types';
import { colors, tabular, type } from '@/theme/tokens';
import type { IconName } from './Button';
import { PressableScale } from './PressableScale';
import { TransactionStatusChip } from './StatusChip';

export const CATEGORY_ICONS: Record<TransactionCategory, IconName> = {
  payroll: 'briefcase-outline',
  housing: 'home-outline',
  internet: 'wifi-outline',
  phone: 'phone-portrait-outline',
  streaming: 'play-circle-outline',
  'credit-card': 'card-outline',
};

interface TransactionRowProps {
  tx: UpcomingTransaction;
  today: string;
  onPress: () => void;
  highlighted?: boolean;
  dimmed?: boolean;
}

export function TransactionRow({ tx, today, onPress, highlighted, dimmed }: TransactionRowProps) {
  const income = tx.direction === 'income';
  const amount = formatDirectional(tx.amount, tx.direction);
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      style={[styles.row, highlighted && styles.highlighted]}
      accessibilityRole="button"
      accessibilityLabel={`${tx.name}, ${amount}, ${formatRelativeDay(tx.date, today)}, ${tx.status}${
        tx.isEdited ? ', edited by you' : ''
      }${tx.isExcluded ? ', excluded' : ''}`}
      accessibilityHint={tx.status === 'predicted' ? 'Opens editing options' : 'Shows details'}
      testID={`txn-${tx.id}`}>
      <View style={[styles.icon, income ? styles.iconIncome : styles.iconExpense]}>
        <Ionicons
          name={CATEGORY_ICONS[tx.category]}
          size={19}
          color={income ? colors.green : colors.text}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, dimmed && styles.dimmed]} numberOfLines={1}>
            {tx.name}
          </Text>
          {tx.isEdited ? (
            <View style={styles.edited}>
              <Text style={styles.editedText}>Edited</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatRelativeDay(tx.date, today)}</Text>
          <TransactionStatusChip status={tx.status} small />
        </View>
        {highlighted ? (
          <Animated.Text entering={FadeIn.delay(300)} style={styles.driver}>
            Drives your lowest balance
          </Animated.Text>
        ) : null}
      </View>
      <Text
        style={[
          styles.amount,
          tabular,
          income && styles.amountIncome,
          dimmed && styles.dimmed,
          tx.isExcluded && styles.struck,
        ]}>
        {amount}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#ABABAB" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 64,
  },
  highlighted: {
    backgroundColor: '#FFF3F5',
    borderWidth: 1,
    borderColor: '#F2B8C3',
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconIncome: { backgroundColor: colors.greenTint },
  iconExpense: { backgroundColor: colors.surface },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...type.body, color: colors.text, flexShrink: 1 },
  edited: { backgroundColor: colors.blueTint, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  editedText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  date: { ...type.footnote, color: colors.textSecondary },
  driver: { fontSize: 12, fontWeight: '700', color: colors.red },
  amount: { ...type.callout, fontWeight: '600', color: colors.text },
  amountIncome: { color: colors.green },
  dimmed: { color: colors.textTertiary },
  struck: { textDecorationLine: 'line-through' },
});
