import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { ListRow, TabScreenHeader, useTabBarSpace } from '@/components/layout';
import { useToast } from '@/components/Toast';
import { useMoney } from '@/state/MoneyProvider';
import { colors, radius, space, type } from '@/theme/tokens';
import { confirmAsync } from '@/utils/dialogs';

export default function MoreScreen() {
  const router = useRouter();
  const toast = useToast();
  const bottomSpace = useTabBarSpace();
  const { state, dispatch } = useMoney();
  const [aboutOpen, setAboutOpen] = useState(false);
  const { firstName, lastName } = state.client;

  const reset = async () => {
    const ok = await confirmAsync({
      title: 'Reset demo?',
      message: 'This restores the original balances, forecast, recommendations, goal and rules.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    dispatch({ type: 'RESET_DEMO' });
    router.navigate('/');
    toast({ message: 'Demo reset. Ready for the next run.', icon: 'refresh' });
  };

  return (
    <View style={styles.screen}>
      <TabScreenHeader title="More" />
      <ScrollView contentContainerStyle={{ paddingBottom: bottomSpace }}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstName[0]}
              {lastName[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.sub}>Demo client · fictional profile</Text>
          </View>
        </View>

        <View style={styles.group}>
          <ListRow icon="flash-outline" title="Smart Savings Rules" onPress={() => router.push('/savings-rules')} />
          <View style={styles.inset} />
          <ListRow icon="home-outline" title="Savings goal" onPress={() => router.push('/goal')} />
          <View style={styles.inset} />
          <ListRow
            icon="information-circle-outline"
            title="About this prototype"
            onPress={() => setAboutOpen(true)}
          />
        </View>

        <Text style={styles.section}>PRESENTER</Text>
        <View style={styles.group}>
          <ListRow
            icon="easel-outline"
            title="Demo Guide"
            subtitle="Predict → Advise → Act"
            tint={colors.textSecondary}
            onPress={() => router.push('/demo-guide')}
            testID="row-demo-guide"
          />
          <View style={styles.inset} />
          <ListRow
            icon="refresh"
            title="Reset demo"
            subtitle="Restore the original demo data"
            tint={colors.textSecondary}
            onPress={reset}
            testID="row-reset"
          />
        </View>

        <Text style={styles.version}>
          Money Intelligence concept · v{Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <BottomSheet visible={aboutOpen} onClose={() => setAboutOpen(false)} title="About this prototype">
        <Text style={styles.about}>
          CIBC Money Intelligence is an unofficial concept prototype created to illustrate a proposed
          capability and its delivery epics during a Product Owner interview.
        </Text>
        <Text style={styles.about}>
          It is not an official CIBC application and is not affiliated with or endorsed by CIBC. CIBC
          names and visual styling are used for illustration only.
        </Text>
        <Text style={styles.about}>
          All people, accounts, merchants and amounts are fictional. It makes no network requests,
          connects to no bank systems and never moves real money.
        </Text>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: space.md,
    marginTop: 10,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 19, fontWeight: '500' },
  name: { ...type.headline, color: colors.textStrong },
  sub: { ...type.footnote, color: colors.textSecondary },
  section: {
    ...type.section,
    fontSize: 13,
    color: '#2F2F2F',
    paddingHorizontal: space.md,
    marginTop: 28,
    marginBottom: 10,
  },
  group: {
    marginHorizontal: space.md,
    marginTop: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    overflow: 'hidden',
  },
  inset: { height: StyleSheet.hairlineWidth, backgroundColor: '#DADADA', marginLeft: 66 },
  version: { ...type.footnote, color: colors.textTertiary, textAlign: 'center', marginTop: 24 },
  about: { ...type.subhead, color: colors.text, marginBottom: 12 },
});
