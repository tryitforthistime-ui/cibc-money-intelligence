import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadow, space, TAB_BAR_HEIGHT, type } from '@/theme/tokens';
import type { IconName } from './Button';
import { PressableScale } from './PressableScale';

/** Bottom padding that keeps content clear of the floating tab bar. */
export function useTabBarSpace(extra = 24): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom - 8, 12) + extra;
}

export function SectionHeading({ title, accessory }: { title: string; accessory?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section} accessibilityRole="header">
        {title}
      </Text>
      {accessory}
    </View>
  );
}

export function Card({
  children,
  style,
  tone = 'outlined',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: 'outlined' | 'filled';
}) {
  return <View style={[tone === 'outlined' ? styles.outlined : styles.filled, style]}>{children}</View>;
}

/** Large title header for the root of each tab (Move money, Advice, More). */
export function TabScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabHeader, { paddingTop: insets.top + 14 }]}>
      <Text style={styles.tabTitle} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.tabSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  tint = colors.red,
  testID,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  tint?: string;
  testID?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={styles.row}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, value].filter(Boolean).join(', ')}
      testID={testID}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color="#A6A6A6" />
    </PressableScale>
  );
}

export function InfoNote({
  children,
  icon = 'information-circle-outline',
  tone = 'neutral',
}: {
  children: ReactNode;
  icon?: IconName;
  tone?: 'neutral' | 'warning' | 'error' | 'success';
}) {
  const palette = {
    neutral: { bg: colors.surfaceAlt, fg: colors.textSecondary },
    warning: { bg: colors.amberTint, fg: colors.amber },
    error: { bg: colors.alertTint, fg: colors.alert },
    success: { bg: colors.greenTint, fg: colors.green },
  }[tone];
  return (
    <View
      style={[styles.note, { backgroundColor: palette.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}>
      <Ionicons name={icon} size={18} color={palette.fg} style={styles.noteIcon} />
      <Text style={[styles.noteText, { color: tone === 'neutral' ? colors.textSecondary : palette.fg }]}>
        {children}
      </Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 34,
    marginBottom: 16,
  },
  section: { ...type.section, color: '#2F2F2F' },
  outlined: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: space.md,
    ...shadow.card,
  },
  filled: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md },
  tabHeader: { paddingHorizontal: space.md, paddingBottom: 8, backgroundColor: colors.background },
  tabTitle: { ...type.largeTitle, color: colors.textStrong },
  tabSubtitle: { ...type.subhead, color: colors.textSecondary, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: space.md,
    backgroundColor: colors.background,
    minHeight: 64,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { ...type.body, color: colors.text },
  rowSubtitle: { ...type.footnote, color: colors.textSecondary, marginTop: 2 },
  rowValue: { ...type.subhead, color: colors.textSecondary },
  note: { flexDirection: 'row', gap: 10, borderRadius: radius.md, padding: 12 },
  noteIcon: { marginTop: 1 },
  noteText: { ...type.footnote, flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#D9D9D9' },
});
