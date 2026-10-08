import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AnimatedMoney } from '@/components/AnimatedMoney';
import { PressableScale } from '@/components/PressableScale';
import type { Account } from '@/domain/types';
import { colors, radius, type } from '@/theme/tokens';

/** Grey account tile used across the home feed (mirrors the reference "Loan" tile). */
export function AccountTile({
  account,
  subtitle,
  onPress,
  active,
  testID,
}: {
  account: Account;
  subtitle: string;
  onPress?: () => void;
  active: boolean;
  testID?: string;
}) {
  const content = (
    <>
      <View style={styles.tileHeader}>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {account.name}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color="#9C9C9C" /> : null}
      </View>
      <Text style={styles.tileSubtitle}>{subtitle}</Text>
      <AnimatedMoney
        value={account.balance}
        decimals="always"
        active={active}
        style={styles.tileAmount}
        testID={testID ? `${testID}-balance` : undefined}
      />
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.tile} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <PressableScale
      style={styles.tile}
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      testID={testID}>
      {content}
    </PressableScale>
  );
}

function CardArt({ mask }: { mask: string }) {
  return (
    <View style={styles.cardArt} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="cardArt" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#6B6B6B" />
            <Stop offset="0.55" stopColor="#2E2E2E" />
            <Stop offset="1" stopColor="#141414" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" rx="7" fill="url(#cardArt)" />
      </Svg>
      <Text style={styles.cardMask}>**{mask}</Text>
      <Text style={styles.cardBrand}>VISA</Text>
    </View>
  );
}

export function CreditCardTile({
  account,
  onPayCard,
  onMore,
  active,
}: {
  account: Account;
  onPayCard: () => void;
  onMore: () => void;
  active: boolean;
}) {
  return (
    <View style={styles.tile}>
      <View style={styles.cardRow}>
        <CardArt mask={account.mask} />
        <View style={styles.cardText}>
          <Text style={styles.tileTitle} numberOfLines={2}>
            {account.name}
          </Text>
          <Text style={styles.tileSubtitle}>**{account.mask}</Text>
        </View>
      </View>
      <AnimatedMoney value={account.balance} decimals="always" active={active} style={styles.tileAmount} />
      <Text style={styles.caption}>Current balance</Text>
      <View style={styles.cardActions}>
        <PressableScale
          style={[styles.cardButton, styles.payButton]}
          onPress={onPayCard}
          accessibilityRole="button"
          accessibilityLabel="Pay card">
          <Text style={styles.cardButtonText}>Pay card</Text>
        </PressableScale>
        <PressableScale
          style={[styles.cardButton, styles.moreButton]}
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel="More card options">
          <Ionicons name="ellipsis-horizontal" size={22} color="#3A3A3A" />
        </PressableScale>
      </View>
    </View>
  );
}

export function PromoCard({ text }: { text: string }) {
  return (
    <View style={styles.promo}>
      <View style={styles.promoIcon}>
        <Ionicons name="add" size={26} color={colors.red} />
      </View>
      <Text style={styles.promoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileTitle: { ...type.body, color: colors.text, flexShrink: 1 },
  tileSubtitle: { ...type.subhead, color: colors.textSecondary, marginTop: 4 },
  tileAmount: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: 10,
    letterSpacing: -0.4,
  },
  caption: { ...type.footnote, color: colors.textSecondary },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardArt: { width: 66, height: 42, borderRadius: 7, overflow: 'hidden', padding: 5 },
  cardMask: { color: '#E9E9E9', fontSize: 10, fontWeight: '600', alignSelf: 'flex-end' },
  cardBrand: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    fontStyle: 'italic',
    position: 'absolute',
    right: 6,
    bottom: 4,
  },
  cardText: { flex: 1 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 14 },
  cardButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButton: { paddingHorizontal: 22 },
  moreButton: { width: 72 },
  cardButtonText: { fontSize: 18, color: '#3A3A3A' },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  promoIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: { ...type.body, color: '#333333', flex: 1 },
});
