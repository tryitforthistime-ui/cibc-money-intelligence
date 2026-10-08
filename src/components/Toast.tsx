import Ionicons from '@expo/vector-icons/Ionicons';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, type } from '@/theme/tokens';
import type { IconName } from './Button';

interface ToastInput {
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState extends ToastInput {
  id: number;
}

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

/** Lightweight iOS-style banner for confirmations ("Rule saved", "Undo"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(0);

  const show = useCallback((input: ToastInput) => {
    counter.current += 1;
    setToast({ ...input, id: counter.current });
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <ToastViewport toast={toast} onHide={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toast, onHide }: { toast: ToastState | null; onHide: () => void }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onHide, toast.actionLabel ? 4200 : 2600);
    return () => clearTimeout(timer);
  }, [toast, onHide]);

  return (
    <View style={[styles.viewport, { top: insets.top + 8 }]}>
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInUp.duration(220)}
          exiting={FadeOutUp.duration(180)}
          style={styles.toast}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert">
          <Ionicons name={toast.icon ?? 'checkmark-circle'} size={20} color="#7FD3A6" />
          <Text style={styles.message} numberOfLines={2}>
            {toast.message}
          </Text>
          {toast.actionLabel ? (
            <Pressable
              hitSlop={10}
              accessibilityRole="button"
              onPress={() => {
                toast.onAction?.();
                onHide();
              }}>
              <Text style={styles.action}>{toast.actionLabel}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  toast: {
    maxWidth: 440,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#232323',
    borderRadius: radius.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
  },
  message: { ...type.subhead, color: '#FFFFFF', flex: 1, fontWeight: '500' },
  action: { ...type.subhead, color: '#FF8FA3', fontWeight: '700' },
});

