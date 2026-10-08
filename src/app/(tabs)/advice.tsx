import { ScrollView, StyleSheet, View } from 'react-native';

import { TabScreenHeader, useTabBarSpace } from '@/components/layout';
import { RecommendationsList } from '@/components/RecommendationsList';
import { colors, space } from '@/theme/tokens';

export default function AdviceScreen() {
  const bottomSpace = useTabBarSpace();
  return (
    <View style={styles.screen}>
      <TabScreenHeader title="Advice" subtitle="Your Recommendations" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomSpace }]}>
        <RecommendationsList showTitle={false} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.md },
});
