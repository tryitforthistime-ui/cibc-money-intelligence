import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CibcLogo } from '@/components/CibcLogo';
import { AccountTile, CreditCardTile, PromoCard } from '@/components/home/AccountTiles';
import { MoneyOutlookCard } from '@/components/home/MoneyOutlookCard';
import { SectionHeading, useTabBarSpace } from '@/components/layout';
import { PressableScale } from '@/components/PressableScale';
import { HelpSheet } from '@/components/sheets/HelpSheet';
import { formatDate } from '@/domain/dates';
import { getAccount } from '@/domain/forecast';
import { ACCOUNT_IDS } from '@/domain/mockData';
import { formatMoney } from '@/domain/money';
import { useMoney } from '@/state/MoneyProvider';
import { colors, space, TAB_BAR_HEIGHT, type } from '@/theme/tokens';
import { confirmAsync } from '@/utils/dialogs';

const HEADER_CONTENT = 64;

export default function HomeScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { state, forecast, chequing, savings } = useMoney();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [updated, setUpdated] = useState(false);
  const lastSafeToSpend = useRef(forecast.safeToSpend);
  const scrollY = useSharedValue(0);

  const headerHeight = insets.top + HEADER_CONTENT;
  const visa = getAccount(state, ACCOUNT_IDS.visa);
  const loan = getAccount(state, ACCOUNT_IDS.loan);

  // Short "analyzing" state on first launch, so the outlook feels computed.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // Flag the card as updated when Safe to Spend changed while the client was elsewhere.
  useEffect(() => {
    if (!focused || lastSafeToSpend.current === forecast.safeToSpend) return;
    lastSafeToSpend.current = forecast.safeToSpend;
    setUpdated(true);
    const timer = setTimeout(() => setUpdated(false), 6000);
    return () => clearTimeout(timer);
  }, [focused, forecast.safeToSpend]);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const hairlineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 24], [0, 1], 'clamp'),
  }));

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const explainCardAction = async (title: string) => {
    const open = await confirmAsync({
      title,
      message: `Card actions aren’t part of this concept prototype. Your automatic payment of ${formatMoney(
        state.creditCard.statementBalance,
      )} on ${formatDate(state.creditCard.dueDate, 'short')} is already included in Money Outlook.`,
      confirmLabel: 'View Money Outlook',
      cancelLabel: 'OK',
    });
    if (open) router.push('/outlook');
  };

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: headerHeight + 4, paddingBottom: bottomSpace }}
        scrollIndicatorInsets={{ top: headerHeight }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.red} progressViewOffset={headerHeight} />
        }
        testID="home-scroll">
        <View style={styles.page}>
          <View style={styles.conceptPill} accessibilityRole="text">
            <Ionicons name="flask-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.conceptText}>Concept prototype · Not an official CIBC app</Text>
          </View>

          <SectionHeading title="BANK ACCOUNTS" />
          <View style={styles.stack}>
            <AccountTile
              account={chequing}
              subtitle={`${chequing.productName} ···${chequing.mask}`}
              onPress={() => router.push('/outlook')}
              active={focused}
              testID="tile-chequing"
            />
            <AccountTile
              account={savings}
              subtitle={`Savings ···${savings.mask}`}
              onPress={() => router.push('/goal')}
              active={focused}
              testID="tile-savings"
            />
          </View>

          <SectionHeading title="CREDIT CARDS" />
          <CreditCardTile
            account={visa}
            active={focused}
            onPayCard={() => explainCardAction('Pay card')}
            onMore={() => explainCardAction('Card options')}
          />
          <PromoCard text="Earn up to $400 in value(†) with a CIBC Dividend® Visa Infinite* Card." />

          <SectionHeading
            title="MONEY OUTLOOK"
            accessory={
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            }
          />
          <MoneyOutlookCard
            active={focused}
            loading={loading}
            updated={updated}
            onViewOutlook={() => router.push('/outlook')}
            onSeeRecommendations={() => router.push('/recommendations')}
          />

          <SectionHeading title="LENDING ACCOUNTS" />
          <AccountTile account={loan} subtitle={`${loan.productName} ···${loan.mask}`} active={focused} />
          <PromoCard text="Get up to $4,500(†) when you buy your first home or purchase a new home." />
        </View>

        <View style={styles.help}>
          <PressableScale
            onPress={() => setHelpOpen(true)}
            style={styles.helpRow}
            accessibilityRole="button"
            scaleTo={0.99}>
            <Text style={styles.helpTitle}>Help Centre</Text>
            <Ionicons name="chevron-forward" size={18} color="#9A9A9A" />
          </PressableScale>
          <View style={styles.helpDivider} />
          <Text style={styles.disclaimer}>
            CIBC Money Intelligence is an unofficial concept prototype created for a Product Owner
            interview. It is not affiliated with or endorsed by CIBC. All names, accounts and amounts
            are fictional and no real money moves.
          </Text>
        </View>
      </Animated.ScrollView>

      <View style={[styles.header, { height: headerHeight, paddingTop: insets.top }]}>
        <CibcLogo height={27} />
        <View style={styles.headerRight}>
          <PressableScale
            style={styles.search}
            onPress={() => router.push('/search')}
            accessibilityRole="search"
            accessibilityLabel="Search"
            testID="home-search">
            <Ionicons name="search-outline" size={20} color={colors.red} />
            <Text style={styles.searchText}>Search</Text>
          </PressableScale>
          <PressableScale
            style={styles.avatar}
            onPress={() => router.navigate('/more')}
            accessibilityRole="button"
            accessibilityLabel={`Profile, ${state.client.firstName} ${state.client.lastName}`}>
            <Text style={styles.avatarText}>
              {state.client.firstName[0]}
              {state.client.lastName[0]}
            </Text>
          </PressableScale>
        </View>
        <Animated.View style={[styles.hairline, hairlineStyle]} />
      </View>

      <PressableScale
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom - 8, 12) + 16 }]}
        onPress={() => setHelpOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Help Centre"
        testID="help-fab">
        <Ionicons name="chatbubbles-outline" size={26} color="#FFFFFF" />
      </PressableScale>

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { paddingHorizontal: space.md },
  stack: { gap: 12 },
  conceptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: -12,
  },
  conceptText: { fontSize: 11.5, color: colors.textSecondary, fontWeight: '500' },
  newBadge: {
    backgroundColor: colors.redTint,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: { fontSize: 11, fontWeight: '800', color: colors.red, letterSpacing: 0.8 },
  help: {
    marginTop: 40,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingTop: 18,
    paddingBottom: 40,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 6,
  },
  helpTitle: { fontSize: 20, color: colors.text },
  helpDivider: { height: 1, backgroundColor: '#DCDCDC', marginHorizontal: 6 },
  disclaimer: { ...type.footnote, color: colors.textSecondary, marginTop: 16, paddingHorizontal: 6 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.97)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: {
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
  },
  searchText: { fontSize: 17, color: '#4A4A4A' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D6D6D6',
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 18px rgba(196,31,62,0.35)',
  },
});
