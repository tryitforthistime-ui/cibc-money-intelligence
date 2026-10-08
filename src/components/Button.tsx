import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, type } from '@/theme/tokens';
import { PressableScale } from './PressableScale';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  icon?: IconName;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  loadingLabel,
  icon,
  compact,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const inactive = disabled || loading;
  const palette = PALETTES[variant];
  const textColor = disabled ? colors.disabledText : palette.text;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={loading && loadingLabel ? loadingLabel : label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        compact && styles.compact,
        {
          backgroundColor: disabled ? colors.disabled : palette.background,
          borderColor: disabled ? colors.disabled : palette.border,
        },
        variant === 'tertiary' && styles.tertiary,
        style,
      ]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : icon ? (
          <Ionicons name={icon} size={19} color={textColor} />
        ) : null}
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
          {loading && loadingLabel ? loadingLabel : label}
        </Text>
      </View>
    </PressableScale>
  );
}

const PALETTES = {
  primary: { background: colors.red, border: colors.red, text: colors.textOnRed },
  secondary: { background: colors.background, border: '#CFCFCF', text: colors.text },
  tertiary: { background: 'transparent', border: 'transparent', text: colors.red },
  destructive: { background: colors.background, border: '#E3B5BF', text: colors.alert },
} as const;

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  compact: { minHeight: 44 },
  tertiary: { minHeight: 44, paddingHorizontal: 8 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...type.headline },
});
