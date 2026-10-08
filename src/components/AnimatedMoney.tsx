import { useEffect, useRef, useState } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { formatMoney, type FormatMoneyOptions } from '@/domain/money';
import type { Cents } from '@/domain/types';
import { tabular } from '@/theme/tokens';

interface AnimatedMoneyProps {
  value: Cents;
  style?: StyleProp<TextStyle>;
  decimals?: FormatMoneyOptions['decimals'];
  /** Only animate while visible, so the count-up plays when the client returns. */
  active?: boolean;
  duration?: number;
  testID?: string;
}

/** Counts from the previous amount to the new one (ease-out) when it changes. */
export function AnimatedMoney({
  value,
  style,
  decimals = 'auto',
  active = true,
  duration = 900,
  testID,
}: AnimatedMoneyProps) {
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);

  useEffect(() => {
    if (!active) return;
    const from = shownRef.current;
    const to = value;
    if (from === to) return;
    const wholeDollars = from % 100 === 0 && to % 100 === 0;
    const start = Date.now();
    let frame = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      let current = from + (to - from) * eased;
      current = wholeDollars ? Math.round(current / 100) * 100 : Math.round(current);
      if (t >= 1) current = to;
      shownRef.current = current;
      setShown(current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, active, duration]);

  return (
    <Text
      testID={testID}
      style={[tabular, style]}
      accessibilityLabel={formatMoney(value, { decimals })}>
      {formatMoney(shown, { decimals })}
    </Text>
  );
}
