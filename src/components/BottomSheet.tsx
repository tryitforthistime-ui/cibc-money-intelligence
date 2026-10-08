import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '@/theme/tokens';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Pinned below the scrollable content (primary actions). */
  footer?: ReactNode;
}

const OPEN_MS = 320;
const CLOSE_MS = 220;

/**
 * iOS-style sheet: dimmed backdrop, grabber, slide-up spring, drag-down and
 * tap-outside to dismiss, keyboard-aware. Built on RN Modal so it renders
 * above navigation on iOS, Android and web.
 */
export function BottomSheet({ visible, onClose, title, children, footer }: BottomSheetProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  // Mount as soon as the sheet is asked to open; unmount after the close animation.
  if (visible && !mounted) setMounted(true);
  const progress = useSharedValue(0);
  const dragY = useSharedValue(0);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (unmountTimer.current) clearTimeout(unmountTimer.current);
    if (visible) {
      dragY.set(0);
      progress.set(withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) }));
    } else {
      progress.set(withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) }));
      unmountTimer.current = setTimeout(() => setMounted(false), CLOSE_MS + 20);
    }
    return () => {
      if (unmountTimer.current) clearTimeout(unmountTimer.current);
    };
  }, [visible, progress, dragY]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * screenHeight + dragY.value }],
  }));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => {
      dragY.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 110 || e.velocityY > 900) {
        onClose();
      } else {
        dragY.set(withTiming(0, { duration: 180 }));
      }
    });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent>
      <GestureHandlerRootView style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { maxHeight: screenHeight * 0.9, paddingBottom: Math.max(insets.bottom, 12) + 8 },
              sheetStyle,
            ]}>
            <GestureDetector gesture={pan}>
              <View style={styles.handleArea}>
                <View style={styles.grabber} />
                <View style={styles.titleRow}>
                  <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
                    {title ?? ''}
                  </Text>
                  <Pressable
                    onPress={onClose}
                    hitSlop={12}
                    style={styles.close}
                    accessibilityRole="button"
                    accessibilityLabel="Close">
                    <Ionicons name="close" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { backgroundColor: colors.scrim },
  keyboard: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'box-none' },
  sheet: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    boxShadow: '0 -6px 30px rgba(0,0,0,0.12)',
  },
  handleArea: { paddingTop: 8, paddingHorizontal: space.lg },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: '#D3D3D3',
    marginBottom: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 6 },
  title: { ...type.title3, color: colors.textStrong, flex: 1 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: 6, paddingBottom: 12 },
  footer: { paddingHorizontal: space.lg, paddingTop: 10, gap: 8 },
});
