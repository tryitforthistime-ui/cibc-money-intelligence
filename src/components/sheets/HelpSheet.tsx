import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomSheet } from '@/components/BottomSheet';
import { colors, type } from '@/theme/tokens';

const FAQS = [
  {
    q: 'What is Safe to Spend?',
    a: 'It’s what’s left in your chequing account after the bills and payments we expect before payday, minus the safety buffer you choose. Tap “How was this calculated?” in your outlook to see every number.',
  },
  {
    q: 'How are bills and paydays detected?',
    a: 'We look for payments that repeat on a regular schedule, plus anything you’ve scheduled. Predicted items are labelled, and you can edit or exclude them.',
  },
  {
    q: 'Will money ever move automatically?',
    a: 'No. Recommendations and Smart Savings Rules only suggest. Every transfer needs your review and confirmation.',
  },
  {
    q: 'Is this the real CIBC app?',
    a: 'No. This is an unofficial concept prototype built for a product interview. All people, accounts and amounts are fictional, and no real money moves.',
  },
];

export function HelpSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Help Centre">
      <Text style={styles.intro}>Questions about Money Outlook</Text>
      {FAQS.map((item, index) => {
        const expanded = open === index;
        return (
          <View key={item.q} style={styles.item}>
            <Pressable
              onPress={() => setOpen(expanded ? null : index)}
              style={styles.question}
              accessibilityRole="button"
              accessibilityState={{ expanded }}>
              <Text style={styles.q}>{item.q}</Text>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </Pressable>
            {expanded ? (
              <Animated.Text entering={FadeIn.duration(200)} style={styles.a}>
                {item.a}
              </Animated.Text>
            ) : null}
          </View>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  intro: { ...type.subhead, color: colors.textSecondary, marginBottom: 6 },
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#D9D9D9' },
  question: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingVertical: 12 },
  q: { ...type.body, color: colors.textStrong, flex: 1, fontWeight: '500' },
  a: { ...type.subhead, color: colors.text, paddingBottom: 14 },
});
