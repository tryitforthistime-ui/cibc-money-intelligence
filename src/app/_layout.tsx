import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { MoneyProvider } from '@/state/MoneyProvider';
import { colors } from '@/theme/tokens';

export const unstable_settings = {
  anchor: '(tabs)',
};

/** On the optional web preview, show the app in a phone-width column. */
function WebFrame({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.webBackdrop}>
      <View style={styles.webPhone}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <MoneyProvider>
          <WebFrame>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerTintColor: colors.red,
                  headerTitleStyle: { color: colors.textStrong, fontWeight: '600', fontSize: 17 },
                  headerStyle: { backgroundColor: colors.background },
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: 'minimal',
                  contentStyle: { backgroundColor: colors.background },
                }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
                <Stack.Screen name="outlook" options={{ title: 'Money Outlook' }} />
                <Stack.Screen name="recommendations" options={{ title: 'Recommendations' }} />
                <Stack.Screen name="transfer" options={{ title: 'Transfer' }} />
                <Stack.Screen name="transfer-review" options={{ title: 'Review transfer' }} />
                <Stack.Screen
                  name="transfer-success"
                  options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
                />
                <Stack.Screen name="savings-rules" options={{ title: 'Smart Savings Rules' }} />
                <Stack.Screen name="goal" options={{ title: 'Savings goal' }} />
                <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="demo-guide" options={{ presentation: 'modal', title: 'Demo Guide' }} />
              </Stack>
            </ToastProvider>
          </WebFrame>
        </MoneyProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  webBackdrop: { flex: 1, backgroundColor: '#E7E7EA', alignItems: 'center' },
  webPhone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    backgroundColor: colors.background,
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(0,0,0,0.12)',
  },
});
