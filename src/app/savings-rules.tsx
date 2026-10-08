import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { InfoNote } from '@/components/layout';
import { MoneyInput } from '@/components/MoneyInput';
import { useToast } from '@/components/Toast';
import { centsToInput, parseMoneyInput } from '@/domain/money';
import { describeRule, evaluateRule, validateRule } from '@/domain/rules';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

// Web-only props understood by react-native-web's Switch.
const webSwitchColors = (Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF' } : {}) as object;

/** Epic 3 — Feature B: client-controlled savings automation that only ever suggests. */
export default function SavingsRulesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { state, forecast, dispatch, goal } = useMoney();
  const rule = state.rule;

  const [thresholdText, setThresholdText] = useState(centsToInput(rule.threshold));
  const [amountText, setAmountText] = useState(centsToInput(rule.amount));
  const [enabled, setEnabled] = useState(rule.enabled);

  const threshold = parseMoneyInput(thresholdText);
  const amount = parseMoneyInput(amountText);
  const errors = validateRule(threshold, amount);
  const valid = !errors.threshold && !errors.amount && threshold !== null && amount !== null;
  const dirty =
    !rule.saved || threshold !== rule.threshold || amount !== rule.amount || enabled !== rule.enabled;
  const evaluation = valid ? evaluateRule({ threshold, amount, enabled }, forecast) : null;

  const statusLabel = !rule.saved ? 'Not set up' : rule.enabled ? 'On' : 'Off';

  const save = () => {
    if (!valid) {
      haptics.warning();
      return;
    }
    dispatch({ type: 'SAVE_RULE', rule: { threshold, amount, enabled } });
    haptics.success();
    toast({
      message: enabled
        ? evaluation?.triggers
          ? 'Rule saved. A suggestion is waiting in Recommendations.'
          : 'Rule saved. We’ll suggest a transfer when there’s room.'
        : 'Rule saved and turned off.',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Get a suggestion when there’s room to save. Rules never move money on their own. You review
          and confirm every transfer.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.icon}>
              <Ionicons name="flash-outline" size={20} color={colors.burgundy} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Save when there’s room</Text>
              <Text style={styles.cardSub}>To {goal.name}</Text>
            </View>
            <View style={[styles.status, rule.saved && rule.enabled ? styles.statusOn : styles.statusOff]}>
              <Text style={[styles.statusText, rule.saved && rule.enabled ? styles.statusTextOn : null]}>
                {statusLabel}
              </Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Rule enabled</Text>
            <Switch
              value={enabled}
              onValueChange={(v) => {
                haptics.selection();
                setEnabled(v);
              }}
              trackColor={{ true: colors.red, false: '#D5D5D5' }}
              thumbColor="#FFFFFF"
              {...webSwitchColors}
              ios_backgroundColor="#D5D5D5"
              accessibilityLabel="Rule enabled"
              testID="rule-enabled"
            />
          </View>

          <Text style={styles.label}>When my projected balance is above</Text>
          <Text style={styles.help}>after upcoming expenses and my safety buffer (Safe to Spend)</Text>
          <MoneyInput
            value={thresholdText}
            onChangeText={setThresholdText}
            invalid={!!errors.threshold}
            accessibilityLabel="Threshold"
            testID="rule-threshold"
          />
          {errors.threshold ? <Text style={styles.error}>{errors.threshold}</Text> : null}

          <Text style={styles.label}>Suggest moving</Text>
          <MoneyInput
            value={amountText}
            onChangeText={setAmountText}
            invalid={!!errors.amount}
            accessibilityLabel="Amount to suggest"
            testID="rule-amount"
          />
          {errors.amount ? <Text style={styles.error}>{errors.amount}</Text> : null}
        </View>

        <Text style={styles.section}>Preview</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>
            {valid
              ? `“${describeRule({ threshold, amount })}”`
              : 'Fix the highlighted fields to preview your rule.'}
          </Text>
        </View>
        {evaluation ? (
          <View style={styles.top}>
            <InfoNote
              icon={evaluation.triggers ? 'checkmark-circle-outline' : 'time-outline'}
              tone={evaluation.triggers ? 'success' : 'neutral'}>
              {evaluation.message}
            </InfoNote>
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={rule.saved ? 'Save changes' : 'Save rule'}
          onPress={save}
          disabled={!valid || !dirty}
          testID="save-rule"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingBottom: 24 },
  intro: { ...type.subhead, color: colors.textSecondary, marginTop: 4 },
  card: { marginTop: 16, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...type.headline, color: colors.textStrong },
  cardSub: { ...type.footnote, color: colors.textSecondary },
  status: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusOn: { backgroundColor: colors.greenTint },
  statusOff: { backgroundColor: '#E6E6E6' },
  statusText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  statusTextOn: { color: colors.green },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    minHeight: 44,
  },
  toggleLabel: { ...type.body, color: colors.text },
  label: { ...type.headline, fontSize: 15, color: colors.textStrong, marginTop: 16 },
  help: { ...type.footnote, color: colors.textSecondary, marginBottom: 8 },
  error: { ...type.footnote, color: colors.alert, marginTop: 6 },
  section: { ...type.headline, color: colors.textStrong, marginTop: 22, marginBottom: 8 },
  preview: { borderLeftWidth: 3, borderLeftColor: colors.burgundy, paddingLeft: 12, paddingVertical: 4 },
  previewText: { ...type.callout, color: colors.text, fontStyle: 'italic' },
  top: { marginTop: 12 },
  footer: {
    paddingHorizontal: space.md,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DADADA',
  },
});
