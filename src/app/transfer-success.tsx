import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { formatDate } from '@/domain/dates';
import { goalProgressFor } from '@/domain/goals';
import { formatMoney } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, tabular, type } from '@/theme/tokens';

function SuccessMark() {
  const scale = useSharedValue(0.4);
  const ring = useSharedValue(0);

  useEffect(() => {
    scale.set(withSpring(1, { damping: 11, stiffness: 160 }));
    ring.set(
      withDelay(200, withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), 2, false)),
    );
  }, [scale, ring]);

  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - ring.value),
    transform: [{ scale: 1 + ring.value * 0.7 }],
  }));

  return (
    <View style={styles.markWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.mark, markStyle]}>
        <Ionicons name="checkmark" size={46} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

/** Epic 3 — Feature A, step 3: confirmation, updated goal and outlook. */
export default function TransferSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, forecast, goal, savings } = useMoney();
  const transfer = state.transfers.find((t) => t.id === id);

  const backHome = () => router.dismissTo('/');
  const viewGoal = () => {
    router.dismissTo('/');
    router.push('/goal');
  };

  if (!transfer) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Transfer not found</Text>
        <Text style={styles.subtitle}>The demo may have been reset.</Text>
        <Button label="Back to Home" onPress={backHome} style={styles.fullWidth} />
      </View>
    );
  }

  const before = goalProgressFor(goal.name, goal.saved - transfer.amount, goal.target);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 24 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SuccessMark />
        <Animated.Text entering={FadeInDown.delay(150).duration(350)} style={styles.title} accessibilityRole="header">
          Transfer complete
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220).duration(350)} style={styles.subtitle}>
          {formatMoney(transfer.amount)} moved to {savings.name}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(260).duration(350)} style={styles.confirmation}>
          Confirmation {transfer.confirmationNumber} · {formatDate(transfer.date, 'short')} · Simulated
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home-outline" size={20} color={colors.burgundy} />
            <Text style={styles.cardTitle}>{goal.name}</Text>
            <Text style={[styles.percent, tabular]}>{goal.percentLabel}</Text>
          </View>
          <ProgressBar ratio={goal.ratio} from={before.ratio} delay={600} accessibilityLabel={`${goal.name} progress`} />
          <Text style={[styles.cardText, tabular]}>
            Saved {formatMoney(goal.saved, { decimals: 'auto' })} of {formatMoney(goal.target, { decimals: 'auto' })} ·
            up from {before.percentLabel}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pulse-outline" size={20} color={colors.burgundy} />
            <Text style={styles.cardTitle}>Money Outlook updated</Text>
          </View>
          <Text style={[styles.cardText, tabular]}>
            Safe to spend is now{' '}
            <Text style={styles.strong}>{formatMoney(forecast.safeToSpend, { decimals: 'auto' })}</Text> until{' '}
            {formatDate(forecast.endDate, 'long')}. Your {formatMoney(forecast.buffer, { decimals: 'auto' })}{' '}
            buffer is untouched.
          </Text>
        </Animated.View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button label="Back to Home" onPress={backHome} testID="success-home" />
        <Button label="View savings goal" variant="secondary" onPress={viewGoal} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.md, gap: 8 },
  fullWidth: { alignSelf: 'stretch', marginTop: 16 },
  content: { paddingHorizontal: space.md, paddingBottom: 24, alignItems: 'stretch' },
  markWrap: { alignItems: 'center', justifyContent: 'center', height: 120, marginTop: 8 },
  ring: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: colors.green },
  mark: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...type.title, color: colors.textStrong, textAlign: 'center', marginTop: 12 },
  subtitle: { ...type.body, color: colors.text, textAlign: 'center', marginTop: 6 },
  confirmation: { ...type.footnote, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginTop: 18, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { ...type.headline, color: colors.textStrong, flex: 1 },
  percent: { ...type.headline, color: colors.red },
  cardText: { ...type.subhead, color: colors.text },
  strong: { fontWeight: '700', color: colors.textStrong },
  footer: { paddingHorizontal: space.md, paddingTop: 10, gap: 10 },
});
