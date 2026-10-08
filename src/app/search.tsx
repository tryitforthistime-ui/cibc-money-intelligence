import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/Button';
import { ListRow } from '@/components/layout';
import { colors, space, type } from '@/theme/tokens';

interface Destination {
  title: string;
  subtitle: string;
  icon: IconName;
  href: Href;
  keywords: string;
}

const webNoFocusRing = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;

const DESTINATIONS: Destination[] = [
  {
    title: 'Money Outlook',
    subtitle: 'Safe to Spend and 14-day forecast',
    icon: 'pulse-outline',
    href: '/outlook',
    keywords: 'forecast cash flow safe spend balance bills payday predict',
  },
  {
    title: 'Your Recommendations',
    subtitle: 'Personalized guidance',
    icon: 'bulb-outline',
    href: '/recommendations',
    keywords: 'advice advise insights shortfall subscription savings',
  },
  {
    title: 'Move money to savings',
    subtitle: 'Transfer to Home Down Payment',
    icon: 'swap-horizontal',
    href: '/transfer',
    keywords: 'transfer move money save act',
  },
  {
    title: 'Smart Savings Rules',
    subtitle: 'Automate savings suggestions',
    icon: 'flash-outline',
    href: '/savings-rules',
    keywords: 'rule automation automatic save',
  },
  {
    title: 'Home Down Payment goal',
    subtitle: 'Savings goal progress',
    icon: 'home-outline',
    href: '/goal',
    keywords: 'goal savings house down payment progress',
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q
    ? DESTINATIONS.filter((d) => `${d.title} ${d.subtitle} ${d.keywords}`.toLowerCase().includes(q))
    : DESTINATIONS;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.bar}>
        <View style={styles.field}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search features"
            placeholderTextColor="#8E8E8E"
            autoFocus
            returnKeyType="search"
            style={[styles.input, webNoFocusRing]}
            selectionColor={colors.red}
            accessibilityLabel="Search"
            testID="search-input"
          />
        </View>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <Text style={styles.heading}>{q ? 'Results' : 'Suggested'}</Text>
      <FlatList
        data={results}
        keyExtractor={(d) => d.title}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListRow
            icon={item.icon}
            title={item.title}
            subtitle={item.subtitle}
            onPress={() => router.replace(item.href)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No matches for “{query}”.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEFF0',
    paddingHorizontal: 12,
  },
  input: { flex: 1, minWidth: 0, fontSize: 17, color: colors.textStrong },
  cancel: { ...type.body, color: colors.red },
  heading: { ...type.footnote, color: colors.textSecondary, fontWeight: '600', paddingHorizontal: space.md, marginTop: 18, marginBottom: 4 },
  empty: { ...type.subhead, color: colors.textSecondary, padding: space.md },
});
