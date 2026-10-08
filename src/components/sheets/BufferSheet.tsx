import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { MoneyInput } from '@/components/MoneyInput';
import { useToast } from '@/components/Toast';
import { buildForecast } from '@/domain/forecast';
import { centsToInput, formatMoney, parseMoneyInput } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, tabular, type } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

const PRESETS = [0, 25_000, 50_000, 75_000, 100_000];

export function BufferSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch } = useMoney();
  const toast = useToast();
  const [text, setText] = useState(centsToInput(state.buffer));
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setText(centsToInput(state.buffer));
  }

  const value = parseMoneyInput(text);
  const error =
    value === null ? 'Enter a buffer amount (it can be $0).' : value > 1_000_000 ? 'Choose $10,000 or less.' : undefined;
  const preview = value !== null && !error ? buildForecast(state, { buffer: value }).safeToSpend : null;

  const save = () => {
    if (value === null || error) return;
    dispatch({ type: 'SET_BUFFER', amount: value });
    haptics.success();
    onClose();
    toast({ message: `Safety buffer set to ${formatMoney(value, { decimals: 'auto' })}.` });
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Safety buffer"
      footer={
        <Button
          label="Save buffer"
          onPress={save}
          disabled={!!error || value === state.buffer}
          testID="save-buffer"
        />
      }>
      <Text style={styles.copy}>
        Money set aside that Safe to Spend never counts, to cover surprises before payday. We recommend{' '}
        {formatMoney(state.recommendedBuffer, { decimals: 'auto' })}, about one week of your usual spending.
      </Text>
      <View style={styles.presets}>
        {PRESETS.map((p) => {
          const selected = value === p;
          return (
            <Pressable
              key={p}
              onPress={() => {
                haptics.selection();
                setText(centsToInput(p));
              }}
              style={[styles.preset, selected && styles.presetSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${formatMoney(p, { decimals: 'auto' })}${p === state.recommendedBuffer ? ', recommended' : ''}`}>
              <Text style={[styles.presetText, selected && styles.presetTextSelected]}>
                {formatMoney(p, { decimals: 'auto' })}
              </Text>
              {p === state.recommendedBuffer ? (
                <Text style={[styles.recommended, selected && styles.presetTextSelected]}>Recommended</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.label}>Or enter an amount</Text>
      <MoneyInput value={text} onChangeText={setText} invalid={!!error} accessibilityLabel="Safety buffer amount" testID="buffer-input" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {preview !== null ? (
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Safe to spend with this buffer</Text>
          <Text style={[styles.previewValue, tabular, preview < 0 && { color: colors.alert }]}>
            {formatMoney(preview, { decimals: 'auto' })}
          </Text>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  copy: { ...type.subhead, color: colors.textSecondary, marginBottom: 14 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    minWidth: 76,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetSelected: { backgroundColor: colors.red, borderColor: colors.red },
  presetText: { ...type.callout, fontWeight: '700', color: colors.textStrong },
  presetTextSelected: { color: '#FFFFFF' },
  recommended: { fontSize: 10.5, fontWeight: '600', color: colors.green },
  label: { ...type.headline, fontSize: 15, color: colors.textStrong, marginTop: 18, marginBottom: 8 },
  error: { ...type.footnote, color: colors.alert, marginTop: 6 },
  preview: { marginTop: 14, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12 },
  previewLabel: { ...type.footnote, color: colors.textSecondary },
  previewValue: { ...type.title3, color: colors.textStrong, marginTop: 2 },
});
