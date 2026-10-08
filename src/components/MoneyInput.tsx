import { forwardRef } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { sanitizeMoneyInput } from '@/domain/money';
import { colors, radius, tabular } from '@/theme/tokens';

interface MoneyInputProps {
  value: string;
  onChangeText: (value: string) => void;
  accessibilityLabel: string;
  size?: 'large' | 'regular';
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  onSubmitEditing?: () => void;
  testID?: string;
}

/** Currency field with a "$" prefix and a decimal keypad. */
export const MoneyInput = forwardRef<TextInput, MoneyInputProps>(function MoneyInput(
  {
    value,
    onChangeText,
    accessibilityLabel,
    size = 'regular',
    invalid,
    autoFocus,
    placeholder = '0',
    style,
    onSubmitEditing,
    testID,
  },
  ref,
) {
  const large = size === 'large';
  return (
    <View
      style={[
        styles.field,
        large ? styles.fieldLarge : styles.fieldRegular,
        invalid && styles.invalid,
        style,
      ]}>
      <Text style={[styles.prefix, large && styles.prefixLarge]}>$</Text>
      <TextInput
        ref={ref}
        testID={testID}
        value={value}
        onChangeText={(text) => onChangeText(sanitizeMoneyInput(text))}
        keyboardType="decimal-pad"
        inputMode="decimal"
        returnKeyType="done"
        autoFocus={autoFocus}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        selectionColor={colors.red}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={onSubmitEditing}
        style={[styles.input, large && styles.inputLarge, tabular, webNoFocusRing]}
        maxLength={10}
      />
    </View>
  );
});

// The field border already shows focus; the browser ring only appears in the web preview.
const webNoFocusRing = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CFCFCF',
    borderRadius: radius.md,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
  },
  fieldRegular: { height: 52 },
  fieldLarge: { height: 76, paddingHorizontal: 18 },
  invalid: { borderColor: colors.alert },
  prefix: { fontSize: 20, fontWeight: '600', color: colors.textSecondary, marginRight: 4 },
  prefixLarge: { fontSize: 34 },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textStrong,
    minWidth: 0,
    paddingVertical: 0,
  },
  inputLarge: { fontSize: 38, fontWeight: '700', letterSpacing: -0.5 },
});
