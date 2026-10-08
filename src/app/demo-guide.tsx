import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, type IconName } from '@/components/Button';
import { useToast } from '@/components/Toast';
import { formatDate } from '@/domain/dates';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, type } from '@/theme/tokens';
import { confirmAsync } from '@/utils/dialogs';

const EPICS: { name: string; icon: IconName; summary: string; stories: string }[] = [
  {
    name: 'Predict',
    icon: 'pulse-outline',
    summary:
      'Forecasts the next 14 days of income and bills to show a transparent, adjustable Safe-to-Spend amount.',
    stories: 'US1 · US2',
  },
  {
    name: 'Advise',
    icon: 'bulb-outline',
    summary:
      'Turns the forecast into explainable, dismissible recommendations that never suggest breaching the client’s buffer.',
    stories: 'US3 · US4',
  },
  {
    name: 'Act',
    icon: 'flash-outline',
    summary:
      'Lets clients move money toward a goal in a few taps, or set rules that suggest transfers, always with confirmation.',
    stories: 'US5 · US6',
  },
];

const JOURNEY = [
  'Home: Money Outlook replaces the blank Insights area.',
  'Tap View my outlook. Explore the 14-day forecast, then How was this calculated?',
  'Back on Home, tap See recommendations and review the $200 savings opportunity.',
  'Tap Move $200 to savings, review the impact, and confirm the simulated transfer.',
  'Back to Home: Safe to Spend, chequing, savings and goal progress have all updated.',
];

/** Optional presenter aid, reached only from More. */
export default function DemoGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { dispatch, state } = useMoney();

  const reset = async () => {
    const ok = await confirmAsync({
      title: 'Reset demo?',
      message: 'This restores the original balances, forecast, recommendations, goal and rules.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    dispatch({ type: 'RESET_DEMO' });
    router.dismissTo('/');
    toast({ message: 'Demo reset. Ready for the next run.', icon: 'refresh' });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      {Platform.OS === 'ios' ? (
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button">
                <Text style={styles.done}>Done</Text>
              </Pressable>
            ),
          }}
        />
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        CIBC Money Intelligence
      </Text>
      <View style={styles.flow} accessible accessibilityLabel="Predict, then Advise, then Act">
        {EPICS.map((epic, i) => (
          <View key={epic.name} style={styles.flowItem}>
            <Text style={styles.flowText}>{epic.name}</Text>
            {i < EPICS.length - 1 ? <Ionicons name="arrow-forward" size={16} color={colors.red} /> : null}
          </View>
        ))}
      </View>
      <Text style={styles.lede}>
        A proposed Money Outlook capability inside the existing mobile banking app, delivered in three
        progressive epics.
      </Text>

      {EPICS.map((epic, i) => (
        <View key={epic.name} style={styles.epic}>
          <View style={styles.epicIcon}>
            <Ionicons name={epic.icon} size={20} color={colors.red} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.epicTitle}>
              Epic {i + 1} · {epic.name}
            </Text>
            <Text style={styles.epicText}>{epic.summary}</Text>
            <Text style={styles.stories}>{epic.stories}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.section}>3-minute journey</Text>
      {JOURNEY.map((step, i) => (
        <View key={step} style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <Text style={styles.meta}>
        Demo date is fixed at {formatDate(state.demoDate, 'weekdayLong')}. All data is fictional and
        nothing leaves the device.
      </Text>

      <Button label="Start from Home" onPress={() => router.dismissTo('/')} style={styles.buttonTop} />
      <Button label="Reset demo" variant="destructive" icon="refresh" onPress={reset} style={styles.buttonGap} testID="guide-reset" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.md, paddingTop: 12 },
  title: { ...type.title, color: colors.textStrong },
  flow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  flowItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flowText: { ...type.title3, color: colors.red, fontWeight: '700' },
  lede: { ...type.subhead, color: colors.textSecondary, marginTop: 10 },
  epic: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    marginTop: 12,
  },
  epicIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  epicTitle: { ...type.headline, color: colors.textStrong },
  epicText: { ...type.subhead, color: colors.text, marginTop: 2 },
  stories: { ...type.caption, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  section: { ...type.title3, color: colors.textStrong, marginTop: 24, marginBottom: 6 },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 6 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  stepText: { ...type.subhead, color: colors.text, flex: 1 },
  meta: { ...type.footnote, color: colors.textSecondary, marginTop: 16 },
  buttonTop: { marginTop: 20 },
  buttonGap: { marginTop: 10 },
  done: { ...type.body, color: colors.red, fontWeight: '600' },
});
