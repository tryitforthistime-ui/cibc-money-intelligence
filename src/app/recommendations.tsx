import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationsList } from '@/components/RecommendationsList';
import { colors, space } from '@/theme/tokens';

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      testID="recommendations-scroll">
      <RecommendationsList showTitle />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.md, paddingTop: 4 },
});
