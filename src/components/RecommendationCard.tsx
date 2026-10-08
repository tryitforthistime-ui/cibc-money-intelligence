import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import type { Recommendation, RecommendationType } from '@/domain/types';
import { colors, radius, type } from '@/theme/tokens';
import { Button, type IconName } from './Button';

const VISUALS: Record<RecommendationType, { icon: IconName; fg: string; bg: string }> = {
  shortfall: { icon: 'alert-circle-outline', fg: colors.amber, bg: colors.amberTint },
  savings: { icon: 'trending-up-outline', fg: colors.green, bg: colors.greenTint },
  subscription: { icon: 'repeat-outline', fg: colors.blue, bg: colors.blueTint },
  rule: { icon: 'flash-outline', fg: colors.burgundy, bg: '#F6EEF1' },
};

interface RecommendationCardProps {
  rec: Recommendation;
  onAction: () => void;
  onDismiss: () => void;
}

export function RecommendationCard({ rec, onAction, onDismiss }: RecommendationCardProps) {
  const [showWhy, setShowWhy] = useState(false);
  const visual =
    rec.severity === 'alert'
      ? { icon: 'warning-outline' as const, fg: colors.alert, bg: colors.alertTint }
      : VISUALS[rec.type];
  const completed = rec.status === 'completed';

  return (
    <Animated.View
      layout={LinearTransition.duration(220)}
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(180)}
      style={[styles.card, rec.severity === 'alert' && styles.alertCard]}
      testID={`rec-${rec.type}`}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: visual.bg }]}>
          <Ionicons name={completed ? 'checkmark-circle' : visual.icon} size={20} color={visual.fg} />
        </View>
        <Text style={[styles.eyebrow, { color: visual.fg }]}>{completed ? 'COMPLETED' : rec.eyebrow}</Text>
        {!completed ? (
          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            style={styles.dismiss}
            accessibilityRole="button"
            accessibilityLabel={`Dismiss: ${rec.title}`}
            testID={`dismiss-${rec.type}`}>
            <Ionicons name="close" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.title} accessibilityRole="header">
        {rec.title}
      </Text>
      <Text style={styles.body}>{rec.body}</Text>

      {rec.outcome ? (
        <View style={styles.outcome}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.outcomeText}>{rec.outcome}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => setShowWhy((v) => !v)}
        style={styles.why}
        accessibilityRole="button"
        accessibilityState={{ expanded: showWhy }}>
        <Text style={styles.whyText}>Why am I seeing this?</Text>
        <Ionicons name={showWhy ? 'chevron-up' : 'chevron-down'} size={16} color={colors.red} />
      </Pressable>
      {showWhy ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.reasons}>
          {rec.reasoning.map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <View style={styles.dot} />
              <Text style={styles.reason}>{reason}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}

      <Button
        label={rec.ctaLabel}
        onPress={onAction}
        variant={rec.type === 'savings' || rec.type === 'rule' ? (completed ? 'secondary' : 'primary') : 'secondary'}
        style={styles.cta}
        testID={`cta-${rec.type}`}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    padding: 16,
    boxShadow: '0 3px 14px rgba(0,0,0,0.05)',
  },
  alertCard: { borderColor: '#EFB3BF' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.eyebrow, flex: 1 },
  dismiss: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  title: { ...type.title3, fontSize: 19, color: colors.textStrong, marginTop: 12 },
  body: { ...type.subhead, color: '#3A3A3A', marginTop: 6, lineHeight: 21 },
  outcome: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  outcomeText: { ...type.footnote, color: colors.green, fontWeight: '600', flex: 1 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, minHeight: 36 },
  whyText: { ...type.subhead, color: colors.red, fontWeight: '600' },
  reasons: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, gap: 8 },
  reasonRow: { flexDirection: 'row', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.burgundy, marginTop: 8 },
  reason: { ...type.footnote, fontSize: 14, lineHeight: 19, color: colors.text, flex: 1 },
  cta: { marginTop: 14 },
});
