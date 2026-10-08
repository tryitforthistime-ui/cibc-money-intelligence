import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Approximation of the CIBC wordmark for this unofficial concept prototype.
 * Drawn in code (no official logo asset is bundled).
 */
export function CibcLogo({ height = 28 }: { height?: number }) {
  const mark = height * 0.95;
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel="CIBC">
      <Text style={[styles.word, { fontSize: height * 1.12, lineHeight: height * 1.2 }]}>CIBC</Text>
      <Svg width={mark} height={mark} viewBox="0 0 24 24" style={{ marginLeft: height * 0.08 }}>
        <Polygon points="12,0 0,12 12,24 12,17.5 6.5,12 12,6.5" fill={colors.burgundy} />
        <Polygon points="12,0 24,12 12,24 12,17.5 17.5,12 12,6.5" fill={colors.red} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  word: {
    color: colors.red,
    fontWeight: '800',
    letterSpacing: -1.2,
    includeFontPadding: false,
  },
});
