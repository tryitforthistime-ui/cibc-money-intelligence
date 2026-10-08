import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { Account } from '@/domain/types';
import { formatMoney } from '@/domain/money';
import { colors, radius, tabular, type } from '@/theme/tokens';
import type { IconName } from './Button';

/** Read-only From / To account summary used in the transfer flow. */
export function AccountSummary({
  label,
  account,
  icon,
  detail,
}: {
  label: string;
  account: Account;
  icon: IconName;
  detail?: string;
}) {
  return (
    <View style={styles.box} accessible accessibilityLabel={`${label}: ${account.name}, ending ${account.mask}. ${detail ?? ''}`}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.burgundy} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={[styles.detail, tabular]}>
          ···{account.mask} · {detail ?? `Balance ${formatMoney(account.balance)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  label: { ...type.footnote, color: colors.textSecondary, fontWeight: '600' },
  name: { ...type.body, color: colors.textStrong, fontWeight: '600', marginTop: 1 },
  detail: { ...type.footnote, color: colors.textSecondary, marginTop: 2 },
});
