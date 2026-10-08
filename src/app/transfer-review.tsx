import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { InfoNote } from '@/components/layout';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDate } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import {
  createTransfer,
  previewTransfer,
  validateTransfer,
  type TransferPreview,
} from '@/domain/transfers';
import type { TransferSource } from '@/domain/types';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

const PROCESSING_MS = 1100;

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}${sub ? `, ${sub}` : ''}`}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={[styles.rowValue, tabular]}>{value}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function Change({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <View style={styles.change} accessible accessibilityLabel={`${label} changes from ${before} to ${after}`}>
      <Text style={styles.changeLabel}>{label}</Text>
      <View style={styles.changeValues}>
        <Text style={[styles.before, tabular]}>{before}</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.textTertiary} />
        <Text style={[styles.after, tabular]}>{after}</Text>
      </View>
    </View>
  );
}

/** Epic 3 — Feature A, step 2: confirmation with every affected balance. */
export default function TransferReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount?: string; source?: string; rec?: string }>();
  const { state, dispatch, chequing, savings } = useMoney();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Freeze what the client confirmed so numbers don't shift while the success screen loads.
  const [confirmed, setConfirmed] = useState<TransferPreview | null>(null);

  const amount = Number(params.amount);
  const source: TransferSource =
    params.source === 'recommendation' || params.source === 'rule' ? params.source : 'manual';
  const validation = validateTransfer(state, Number.isFinite(amount) ? amount : null);
  const preview = confirmed ?? (validation.ok ? previewTransfer(state, amount) : null);
  const money = (cents: number) => formatMoney(cents, { decimals: 'auto' });

  const confirm = () => {
    if (submitting) return;
    const check = validateTransfer(state, amount);
    if (!check.ok) {
      setError(check.error ?? 'This transfer can’t be completed.');
      haptics.warning();
      return;
    }
    setSubmitting(true);
    setConfirmed(previewTransfer(state, amount));
    haptics.press();
    setTimeout(() => {
      const transfer = createTransfer(state, amount, source, params.rec || undefined);
      dispatch({ type: 'COMPLETE_TRANSFER', transfer });
      haptics.success();
      router.replace({ pathname: '/transfer-success', params: { id: transfer.id } });
    }, PROCESSING_MS);
  };

  if (!preview) {
    return (
      <View style={[styles.screen, styles.invalid]}>
        <InfoNote icon="alert-circle" tone="error">
          {validation.error ?? 'This transfer can’t be completed.'}
        </InfoNote>
        <Button label="Edit amount" variant="secondary" onPress={() => router.back()} style={styles.top} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>You’re moving</Text>
          <Text style={[styles.amount, tabular]} testID="review-amount">
            {formatMoney(amount)}
          </Text>
        </View>

        <View style={styles.card}>
          <Row label="From" value={`${chequing.name}`} sub={`···${chequing.mask}`} />
          <View style={styles.divider} />
          <Row label="To" value={savings.name} sub={`···${savings.mask}`} />
          <View style={styles.divider} />
          <Row label="Amount" value={formatMoney(amount)} />
          <View style={styles.divider} />
          <Row label="When" value={`Today, ${formatDate(state.demoDate, 'short')}`} sub="One-time · Immediate" />
        </View>

        <Text style={styles.section}>What changes</Text>
        <View style={styles.card}>
          <Change
            label="Safe to spend"
            before={money(preview.safeToSpend.before)}
            after={money(preview.safeToSpend.after)}
          />
          <View style={styles.divider} />
          <Change label="Chequing balance" before={formatMoney(preview.chequing.before)} after={formatMoney(preview.chequing.after)} />
          <View style={styles.divider} />
          <Change label="Savings balance" before={formatMoney(preview.savings.before)} after={formatMoney(preview.savings.after)} />
          <View style={styles.divider} />
          <View style={styles.goal}>
            <Change
              label={`${preview.goal.after.name} goal`}
              before={preview.goal.before.percentLabel}
              after={preview.goal.after.percentLabel}
            />
            <ProgressBar
              ratio={preview.goal.before.ratio}
              previewRatio={preview.goal.after.ratio}
              height={10}
              style={styles.goalBar}
              accessibilityLabel="Savings goal progress preview"
            />
            <Text style={[styles.goalText, tabular]}>
              {money(preview.goal.after.saved)} of {money(preview.goal.after.target)}
            </Text>
          </View>
        </View>

        {error ? (
          <View style={styles.top}>
            <InfoNote icon="alert-circle" tone="error">
              {error}
            </InfoNote>
          </View>
        ) : null}

        <View style={styles.top}>
          <InfoNote icon="flask-outline">
            Simulated transfer in a concept prototype. No real money moves and no bank systems are
            contacted.
          </InfoNote>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label="Confirm transfer"
          onPress={confirm}
          loading={submitting}
          loadingLabel="Processing…"
          testID="confirm-transfer"
        />
        <Button label="Edit amount" variant="tertiary" onPress={() => router.back()} disabled={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  invalid: { padding: space.md },
  content: { paddingHorizontal: space.md, paddingBottom: 24 },
  amountBlock: { alignItems: 'center', paddingVertical: 14 },
  amountLabel: { ...type.subhead, color: colors.textSecondary },
  amount: { fontSize: 44, lineHeight: 52, fontWeight: '700', letterSpacing: -1, color: colors.textStrong },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12 },
  rowLabel: { ...type.subhead, color: colors.textSecondary },
  rowRight: { alignItems: 'flex-end', flexShrink: 1 },
  rowValue: { ...type.subhead, color: colors.textStrong, fontWeight: '600', textAlign: 'right' },
  rowSub: { ...type.footnote, color: colors.textSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D3D3D3' },
  section: { ...type.headline, color: colors.textStrong, marginTop: 22, marginBottom: 10 },
  change: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 12 },
  changeLabel: { ...type.subhead, color: colors.text, flex: 1 },
  changeValues: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  before: { ...type.subhead, color: colors.textTertiary },
  after: { ...type.subhead, color: colors.textStrong, fontWeight: '700' },
  goal: { paddingBottom: 12 },
  goalBar: { marginTop: 2 },
  goalText: { ...type.footnote, color: colors.textSecondary, marginTop: 6 },
  top: { marginTop: 16 },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: 10,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DADADA',
  },
});
