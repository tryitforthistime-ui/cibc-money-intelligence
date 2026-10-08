import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate } from '@/domain/dates';
import { RECOMMENDATION_IDS } from '@/domain/recommendations';
import type { Recommendation } from '@/domain/types';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, type } from '@/theme/tokens';
import { InfoNote, ListRow } from './layout';
import { RecommendationCard } from './RecommendationCard';
import { SubscriptionSheet } from './sheets/SubscriptionSheet';
import { useToast } from './Toast';

/** "Your Recommendations" (Epic 2). Used by the pushed screen and the Advice tab. */
export function RecommendationsList({ showTitle }: { showTitle: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { recommendations, forecast, dispatch, state } = useMoney();
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  const visible = recommendations.filter((r) => r.status !== 'dismissed');
  const dismissedCount = recommendations.length - visible.length;
  const savingsAvailable = recommendations.some((r) => r.id === RECOMMENDATION_IDS.savings);

  const act = (rec: Recommendation) => {
    switch (rec.type) {
      case 'shortfall':
        router.push({ pathname: '/outlook', params: { focus: 'shortfall' } });
        return;
      case 'subscription':
        setSubscriptionOpen(true);
        return;
      case 'savings':
      case 'rule':
        if (rec.status === 'completed') {
          router.push('/goal');
        } else {
          router.push({
            pathname: '/transfer',
            params: {
              amount: String(rec.suggestedAmount ?? 0),
              source: rec.type === 'rule' ? 'rule' : 'recommendation',
              rec: rec.id,
            },
          });
        }
    }
  };

  const dismiss = (rec: Recommendation) => {
    dispatch({ type: 'DISMISS_RECOMMENDATION', id: rec.id });
    toast({
      message: 'Recommendation dismissed.',
      icon: 'eye-off-outline',
      actionLabel: 'Undo',
      onAction: () => dispatch({ type: 'RESTORE_RECOMMENDATION', id: rec.id }),
    });
  };

  return (
    <View>
      {showTitle ? (
        <Text style={styles.title} accessibilityRole="header">
          Your Recommendations
        </Text>
      ) : null}
      <Text style={styles.subtitle}>
        Based on your Money Outlook until {formatDate(forecast.endDate, 'long')}. They update as your
        forecast changes.
      </Text>

      <View style={styles.list}>
        {visible.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} onAction={() => act(rec)} onDismiss={() => dismiss(rec)} />
        ))}
        {visible.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={26} color={colors.textTertiary} />
            <Text style={styles.emptyText}>You’re all caught up.</Text>
          </View>
        ) : null}
      </View>

      {!savingsAvailable ? (
        <View style={styles.spaced}>
          <InfoNote icon="pause-circle-outline" tone="warning">
            Savings suggestions are paused. Moving money now could take your projected balance below your
            safety buffer before payday.
          </InfoNote>
        </View>
      ) : null}

      {dismissedCount > 0 ? (
        <Pressable
          style={styles.restore}
          onPress={() => dispatch({ type: 'RESTORE_DISMISSED' })}
          accessibilityRole="button"
          testID="restore-dismissed">
          <Ionicons name="refresh" size={16} color={colors.red} />
          <Text style={styles.restoreText}>
            {dismissedCount} dismissed · Show again
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.automate}>
        <ListRow
          icon="flash-outline"
          title="Smart Savings Rules"
          subtitle={
            state.rule.saved
              ? state.rule.enabled
                ? 'Your rule is on. You confirm every transfer.'
                : 'Your rule is off.'
              : 'Get a suggestion whenever there’s room to save.'
          }
          onPress={() => router.push('/savings-rules')}
          testID="row-savings-rules"
        />
      </View>

      <Text style={styles.disclaimer}>
        Recommendations are estimates based on your forecast, not guarantees or financial advice. Nothing
        moves without your confirmation.
      </Text>

      <SubscriptionSheet visible={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.largeTitle, fontSize: 28, color: colors.textStrong },
  subtitle: { ...type.subhead, color: colors.textSecondary, marginTop: 6 },
  list: { gap: 14, marginTop: 18 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { ...type.body, color: colors.textSecondary },
  spaced: { marginTop: 14 },
  restore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    marginTop: 10,
  },
  restoreText: { ...type.subhead, color: colors.red, fontWeight: '600' },
  automate: {
    marginTop: 18,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    overflow: 'hidden',
  },
  disclaimer: { ...type.footnote, color: colors.textTertiary, marginTop: 18 },
});
