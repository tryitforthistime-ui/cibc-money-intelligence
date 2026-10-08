import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { OutlookStatus } from '@/domain/forecast';
import type { TransactionStatus } from '@/domain/types';
import { colors, radius } from '@/theme/tokens';
import type { IconName } from './Button';

interface ChipStyle {
  label: string;
  icon: IconName;
  fg: string;
  bg: string;
  dashed?: boolean;
}

const TRANSACTION: Record<TransactionStatus, ChipStyle> = {
  confirmed: { label: 'Confirmed', icon: 'checkmark-circle', fg: colors.green, bg: colors.greenTint },
  scheduled: { label: 'Scheduled', icon: 'calendar', fg: colors.blue, bg: colors.blueTint },
  predicted: {
    label: 'Predicted',
    icon: 'analytics-outline',
    fg: colors.textSecondary,
    bg: colors.background,
    dashed: true,
  },
};

const OUTLOOK: Record<OutlookStatus, ChipStyle> = {
  'on-track': { label: 'On track', icon: 'checkmark-circle', fg: colors.green, bg: colors.greenTint },
  tight: { label: 'Tight', icon: 'alert-circle', fg: colors.amber, bg: colors.amberTint },
  'below-buffer': { label: 'Below buffer', icon: 'warning', fg: colors.alert, bg: colors.alertTint },
};

function Chip({ chip, small }: { chip: ChipStyle; small?: boolean }) {
  return (
    <View
      style={[
        styles.chip,
        small && styles.small,
        { backgroundColor: chip.bg, borderColor: chip.dashed ? '#A8A8A8' : chip.bg },
        chip.dashed && styles.dashed,
      ]}
      accessibilityLabel={chip.label}>
      <Ionicons name={chip.icon} size={small ? 11 : 13} color={chip.fg} />
      <Text style={[styles.label, small && styles.smallLabel, { color: chip.fg }]}>{chip.label}</Text>
    </View>
  );
}

export function TransactionStatusChip({ status, small }: { status: TransactionStatus; small?: boolean }) {
  return <Chip chip={TRANSACTION[status]} small={small} />;
}

export function OutlookStatusChip({ status }: { status: OutlookStatus }) {
  return <Chip chip={OUTLOOK[status]} />;
}

export const TRANSACTION_STATUS_COPY: Record<TransactionStatus, string> = {
  confirmed: 'The amount and date are known, for example from an eBill or a pending debit.',
  scheduled: 'You set it up in CIBC banking, like a scheduled e-Transfer or automatic payment.',
  predicted: 'Detected from your recurring history. Amount and date may vary.',
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
  dashed: { borderStyle: 'dashed' },
  label: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  smallLabel: { fontSize: 11.5, lineHeight: 14 },
});
