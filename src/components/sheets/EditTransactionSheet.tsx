import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { InfoNote } from '@/components/layout';
import { MoneyInput } from '@/components/MoneyInput';
import { TRANSACTION_STATUS_COPY, TransactionStatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { addDays, formatDate } from '@/domain/dates';
import { buildForecast } from '@/domain/forecast';
import { centsToInput, formatDirectional, formatMoney, parseMoneyInput } from '@/domain/money';
import { moneyReducer } from '@/domain/reducer';
import type { UpcomingTransaction } from '@/domain/types';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, tabular, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

interface EditTransactionSheetProps {
  tx: UpcomingTransaction | undefined;
  visible: boolean;
  onClose: () => void;
}

/**
 * Predicted items: edit amount/date or exclude them.
 * Confirmed/scheduled items: read-only explanation of how they're known.
 */
export function EditTransactionSheet({ tx, visible, onClose }: EditTransactionSheetProps) {
  const { state, dispatch, forecast } = useMoney();
  const toast = useToast();
  const [amountText, setAmountText] = useState('');
  const [date, setDate] = useState('');
  const datesRef = useRef<ScrollView>(null);

  // Reset the form each time the sheet opens for a transaction.
  const openFor = visible && tx ? tx.id : null;
  const [lastOpenFor, setLastOpenFor] = useState<string | null>(null);
  if (openFor !== lastOpenFor) {
    setLastOpenFor(openFor);
    if (openFor && tx) {
      setAmountText(centsToInput(tx.amount));
      setDate(tx.date);
    }
  }

  const editable = tx?.status === 'predicted';
  const amount = parseMoneyInput(amountText);
  const amountError =
    amount === null || amount <= 0 ? 'Enter an amount greater than $0.' : amount > 5_000_000 ? 'That amount looks too large.' : undefined;
  const changed = !!tx && (amount !== tx.amount || date !== tx.date);

  const preview = useMemo(() => {
    if (!tx || !editable || amountError || !changed || amount === null) return null;
    const next = moneyReducer(state, { type: 'EDIT_TRANSACTION', id: tx.id, amount, date });
    return buildForecast(next).safeToSpend;
  }, [tx, editable, amountError, changed, amount, date, state]);

  const dates = useMemo(
    () => Array.from({ length: state.horizonDays + 1 }, (_, i) => addDays(state.demoDate, i)),
    [state.horizonDays, state.demoDate],
  );

  if (!tx) return null;

  const save = () => {
    if (amount === null || amountError) return;
    dispatch({ type: 'EDIT_TRANSACTION', id: tx.id, amount, date });
    haptics.success();
    onClose();
    const next = buildForecast(moneyReducer(state, { type: 'EDIT_TRANSACTION', id: tx.id, amount, date }));
    toast({ message: `Forecast updated. Safe to spend: ${formatMoney(next.safeToSpend, { decimals: 'auto' })}` });
  };

  const toggleExcluded = () => {
    dispatch({ type: tx.isExcluded ? 'INCLUDE_TRANSACTION' : 'EXCLUDE_TRANSACTION', id: tx.id });
    haptics.press();
    onClose();
    toast({
      message: tx.isExcluded ? `${tx.name} is back in your forecast.` : `${tx.name} excluded from your forecast.`,
      actionLabel: tx.isExcluded ? undefined : 'Undo',
      onAction: tx.isExcluded ? undefined : () => dispatch({ type: 'INCLUDE_TRANSACTION', id: tx.id }),
      icon: tx.isExcluded ? 'checkmark-circle' : 'eye-off-outline',
    });
  };

  const resetToDetected = () => {
    dispatch({ type: 'RESET_TRANSACTION', id: tx.id });
    onClose();
    toast({ message: `${tx.name} reset to the detected amount and date.` });
  };

  const recent = [...tx.history].reverse().slice(0, 3);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={tx.name}
      footer={
        editable ? (
          <>
            {!tx.isExcluded ? (
              <Button label="Save changes" onPress={save} disabled={!changed || !!amountError} testID="save-transaction" />
            ) : null}
            <Button
              label={tx.isExcluded ? 'Include in forecast again' : 'Not recurring? Exclude from forecast'}
              variant={tx.isExcluded ? 'secondary' : 'destructive'}
              onPress={toggleExcluded}
              compact
              testID="exclude-transaction"
            />
          </>
        ) : (
          <Button label="Done" onPress={onClose} />
        )
      }>
      <View style={styles.header}>
        <Text style={styles.merchant}>{tx.merchant}</Text>
        <TransactionStatusChip status={tx.status} />
      </View>
      <Text style={styles.statusCopy}>{TRANSACTION_STATUS_COPY[tx.status]}</Text>
      <InfoNote icon="search-outline">{tx.source}</InfoNote>

      {editable && !tx.isExcluded ? (
        <>
          <Text style={styles.label}>Amount</Text>
          <MoneyInput
            value={amountText}
            onChangeText={setAmountText}
            invalid={!!amountError}
            accessibilityLabel={`${tx.name} amount`}
            testID="edit-amount"
          />
          {amountError ? <Text style={styles.error}>{amountError}</Text> : null}

          <Text style={styles.label}>Expected date</Text>
          <ScrollView
            ref={datesRef}
            horizontal
            onLayout={() => {
              const index = dates.indexOf(date);
              if (index > 2) datesRef.current?.scrollTo({ x: (index - 2) * 60, animated: false });
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dates}
            keyboardShouldPersistTaps="handled">
            {dates.map((d) => {
              const selected = d === date;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    haptics.selection();
                    setDate(d);
                  }}
                  style={[styles.dateChip, selected && styles.dateChipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={formatDate(d, 'weekdayLong')}>
                  <Text style={[styles.dateWeekday, selected && styles.dateSelectedText]}>
                    {formatDate(d, 'chip').split(' ')[0]}
                  </Text>
                  <Text style={[styles.dateDay, selected && styles.dateSelectedText]}>
                    {formatDate(d, 'chip').split(' ')[1]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {preview !== null ? (
            <View style={styles.preview} accessibilityLiveRegion="polite">
              <Text style={styles.previewLabel}>Safe to spend would change</Text>
              <Text style={[styles.previewValue, tabular]}>
                {formatMoney(forecast.safeToSpend, { decimals: 'auto' })} → {formatMoney(preview, { decimals: 'auto' })}
              </Text>
            </View>
          ) : null}

          {tx.isEdited ? (
            <Button label="Reset to detected amount and date" variant="tertiary" onPress={resetToDetected} />
          ) : null}
        </>
      ) : (
        <View style={styles.summary}>
          <Text style={styles.summaryRow}>
            Amount: <Text style={styles.summaryStrong}>{formatDirectional(tx.amount, tx.direction)}</Text>
          </Text>
          <Text style={styles.summaryRow}>
            Date: <Text style={styles.summaryStrong}>{formatDate(tx.date, 'weekdayLong')}</Text>
          </Text>
          {tx.isExcluded ? (
            <Text style={styles.summaryRow}>This item is excluded and doesn’t affect Safe to Spend.</Text>
          ) : null}
          {!editable ? (
            <Text style={styles.summaryNote}>
              Because it’s {tx.status}, it can’t be edited here. Changes to scheduled payments are made
              where they were set up.
            </Text>
          ) : null}
        </View>
      )}

      <Text style={styles.label}>Recent history</Text>
      <View style={styles.history}>
        {recent.map((h) => (
          <View key={h.date} style={styles.historyRow}>
            <Text style={styles.historyDate}>{formatDate(h.date, 'weekdayShort')}</Text>
            <Text style={[styles.historyAmount, tabular]}>{formatDirectional(h.amount, tx.direction)}</Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  merchant: { ...type.subhead, color: colors.textSecondary, flex: 1 },
  statusCopy: { ...type.footnote, color: colors.textSecondary, marginTop: 6, marginBottom: 12 },
  label: { ...type.headline, fontSize: 15, color: colors.textStrong, marginTop: 18, marginBottom: 8 },
  error: { ...type.footnote, color: colors.alert, marginTop: 6 },
  dates: { gap: 8, paddingRight: 8 },
  dateChip: {
    width: 52,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  dateChipSelected: { backgroundColor: colors.red, borderColor: colors.red },
  dateWeekday: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  dateDay: { fontSize: 19, color: colors.textStrong, fontWeight: '700' },
  dateSelectedText: { color: '#FFFFFF' },
  preview: {
    marginTop: 16,
    backgroundColor: colors.blueTint,
    borderRadius: radius.md,
    padding: 12,
  },
  previewLabel: { ...type.footnote, color: colors.blue, fontWeight: '600' },
  previewValue: { ...type.headline, color: colors.textStrong, marginTop: 2 },
  summary: { marginTop: 16, gap: 6 },
  summaryRow: { ...type.subhead, color: colors.text },
  summaryStrong: { fontWeight: '700' },
  summaryNote: { ...type.footnote, color: colors.textSecondary, marginTop: 4 },
  history: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: 14 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9 },
  historyDate: { ...type.subhead, color: colors.textSecondary },
  historyAmount: { ...type.subhead, color: colors.text, fontWeight: '600' },
});
