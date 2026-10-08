import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSummary } from '@/components/AccountSummary';
import { Button } from '@/components/Button';
import { InfoNote } from '@/components/layout';
import { MoneyInput } from '@/components/MoneyInput';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDate } from '@/domain/dates';
import { centsToInput, formatMoney, parseMoneyInput } from '@/domain/money';
import { suggestSavingsAmount, validateTransfer } from '@/domain/transfers';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

const QUICK_AMOUNTS = [5_000, 10_000, 20_000, 30_000];

/** Epic 3 — Feature A, step 1: choose the amount to move toward the goal. */
export default function TransferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount?: string; source?: string; rec?: string }>();
  const { state, forecast, chequing, savings, goal } = useMoney();

  const suggested = Number(params.amount) > 0 ? Number(params.amount) : suggestSavingsAmount(forecast.safeToSpend);
  const [text, setText] = useState(suggested > 0 ? centsToInput(suggested) : '');
  const [touched, setTouched] = useState(false);

  const amount = parseMoneyInput(text);
  const validation = validateTransfer(state, amount);
  const showError = !validation.ok && (touched || amount !== null);
  const fromRecommendation = params.source === 'recommendation' || params.source === 'rule';

  const review = () => {
    setTouched(true);
    if (!validation.ok || amount === null) {
      haptics.warning();
      return;
    }
    router.push({
      pathname: '/transfer-review',
      params: { amount: String(amount), source: params.source ?? 'manual', rec: params.rec ?? '' },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Move money toward your goal
        </Text>

        <View style={styles.accounts}>
          <AccountSummary
            label="From"
            account={chequing}
            icon="wallet-outline"
            detail={`Available ${formatMoney(chequing.balance)}`}
          />
          <View style={styles.arrow}>
            <Ionicons name="arrow-down" size={18} color={colors.textSecondary} />
          </View>
          <AccountSummary
            label="To"
            account={savings}
            icon="home-outline"
            detail={`${goal.name}: ${goal.percentLabel} of ${formatMoney(goal.target, { decimals: 'auto' })}`}
          />
          <ProgressBar ratio={goal.ratio} height={6} style={styles.goalBar} accessibilityLabel={`${goal.name} progress`} />
        </View>

        <Text style={styles.label}>Amount</Text>
        <MoneyInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setTouched(true);
          }}
          size="large"
          invalid={showError}
          accessibilityLabel="Transfer amount"
          testID="transfer-amount"
          onSubmitEditing={review}
        />

        <View style={styles.chips}>
          {QUICK_AMOUNTS.filter((q) => q <= validation.maxSafeAmount).map((q) => {
            const selected = amount === q;
            return (
              <Pressable
                key={q}
                onPress={() => {
                  haptics.selection();
                  setText(centsToInput(q));
                }}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {formatMoney(q, { decimals: 'auto' })}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showError ? (
          <View style={styles.feedback}>
            <InfoNote icon="alert-circle" tone="error">
              {validation.error}
            </InfoNote>
          </View>
        ) : amount !== null ? (
          <View style={styles.feedback}>
            <InfoNote icon="shield-checkmark-outline" tone="success">
              {fromRecommendation && amount === suggested
                ? `Suggested amount: ${formatMoney(suggested, { decimals: 'auto' })}. `
                : ''}
              You’d still have {formatMoney(forecast.safeToSpend - amount, { decimals: 'auto' })} safe to
              spend until {formatDate(forecast.endDate, 'short')}, and your{' '}
              {formatMoney(forecast.buffer, { decimals: 'auto' })} buffer stays untouched.
            </InfoNote>
          </View>
        ) : null}

        <Text style={styles.footnote}>
          One-time transfer between your own accounts, today. You’ll review everything before confirming.
          Simulated in this prototype.
        </Text>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button label="Review transfer" onPress={review} disabled={!validation.ok} testID="review-transfer" />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.md, paddingTop: 4, paddingBottom: 24 },
  title: { ...type.title, color: colors.textStrong },
  accounts: { marginTop: 18, gap: 6 },
  arrow: { alignItems: 'center', height: 18, justifyContent: 'center' },
  goalBar: { marginTop: 6 },
  label: { ...type.headline, color: colors.textStrong, marginTop: 24, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  chip: {
    minWidth: 64,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.red, borderColor: colors.red },
  chipText: { ...type.subhead, fontWeight: '600', color: colors.text },
  chipTextSelected: { color: '#FFFFFF' },
  feedback: { marginTop: 16 },
  footnote: { ...type.footnote, color: colors.textTertiary, marginTop: 16 },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DADADA',
    backgroundColor: colors.background,
  },
});
