import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, TAB_BAR_HEIGHT } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';
import type { IconName } from './Button';

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  'move-money': { active: 'swap-horizontal', inactive: 'swap-horizontal' },
  advice: { active: 'stats-chart', inactive: 'stats-chart-outline' },
  more: { active: 'grid', inactive: 'grid-outline' },
};

/** Floating pill tab bar matching the reference CIBC app (Home, Move money, Advice, More). */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom - 8, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const options = descriptors[route.key].options;
          const label = options.title ?? route.name;
          const icon = ICONS[route.name] ?? ICONS.index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              haptics.selection();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.item}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              testID={`tab-${route.name}`}>
              <View style={[styles.itemInner, focused && styles.itemFocused]}>
                <Ionicons
                  name={focused ? icon.active : icon.inactive}
                  size={24}
                  color={focused ? colors.red : '#3B3B3B'}
                />
                <Text style={[styles.label, focused && styles.labelFocused]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    pointerEvents: 'box-none',
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    backgroundColor: 'rgba(255,255,255,0.97)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E4E4E4',
    boxShadow: '0 6px 26px rgba(0,0,0,0.13)',
  },
  item: { flex: 1, height: '100%', justifyContent: 'center' },
  itemInner: {
    height: TAB_BAR_HEIGHT - 10,
    borderRadius: (TAB_BAR_HEIGHT - 10) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  itemFocused: { backgroundColor: '#EDEDED' },
  label: { fontSize: 12.5, color: '#2E2E2E', fontWeight: '500' },
  labelFocused: { fontWeight: '700', color: colors.textStrong },
});
