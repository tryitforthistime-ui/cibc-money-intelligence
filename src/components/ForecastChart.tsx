import { area, curveMonotoneX, line } from 'd3-shape';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatDate } from '@/domain/dates';
import { formatMoney } from '@/domain/money';
import type { Cents, ForecastEntry } from '@/domain/types';
import { colors } from '@/theme/tokens';
import { haptics } from '@/utils/haptics';

interface ForecastChartProps {
  entries: ForecastEntry[];
  buffer: Cents;
  height: number;
  variant: 'compact' | 'detailed';
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  lowestDayIndex?: number;
  highlightDayIndexes?: number[];
  testID?: string;
}

const PAD = {
  compact: { top: 10, bottom: 22, left: 6, right: 6 },
  /** Left gutter holds the y-axis labels; bottom fits two-line day labels. */
  detailed: { top: 14, bottom: 34, left: 40, right: 10 },
};

/** Rounds up to a value whose half is also a round axis label ($1k, $2.5k, $5k…). */
function niceCeiling(cents: number): number {
  const dollars = Math.max(1, cents / 100);
  const step = dollars > 10_000 ? 2000 : dollars > 2000 ? 1000 : 500;
  return Math.ceil(dollars / step) * step * 100;
}

function shortAxisLabel(cents: number): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1000) return `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}k`;
  return `$${dollars}`;
}

/**
 * Projected daily closing balance with the safety buffer, lowest point and
 * income/expense markers. Tap or drag horizontally to inspect a day; vertical
 * drags still scroll the page.
 */
export function ForecastChart({
  entries,
  buffer,
  height,
  variant,
  selectedIndex,
  onSelectIndex,
  lowestDayIndex,
  highlightDayIndexes = [],
  testID,
}: ForecastChartProps) {
  const [width, setWidth] = useState(0);
  const pad = PAD[variant];
  const detailed = variant === 'detailed';
  const plotW = Math.max(1, width - pad.left - pad.right);
  const plotH = Math.max(1, height - pad.top - pad.bottom);
  const count = entries.length;

  const geometry = useMemo(() => {
    const values = entries.map((e) => e.closingBalance);
    const minValue = Math.min(0, ...values, ...entries.map((e) => e.lowBalance), buffer);
    const peak = Math.max(...values, buffer);
    const maxValue = detailed ? niceCeiling(peak * 1.06) : Math.round(peak * 1.1);
    const span = maxValue - minValue || 1;
    const x = (i: number) => pad.left + (count > 1 ? (i * plotW) / (count - 1) : plotW / 2);
    const y = (v: number) => pad.top + ((maxValue - v) / span) * plotH;
    const points = entries.map((e, i) => [x(i), y(e.closingBalance)] as [number, number]);
    const linePath = line().curve(curveMonotoneX)(points) ?? '';
    const areaPath =
      area()
        .curve(curveMonotoneX)
        .y0(y(minValue))
        .y1((p) => p[1])(points) ?? '';
    const ticks = detailed ? [0, maxValue / 2, maxValue].filter((v) => v >= minValue) : [];
    return { x, y, linePath, areaPath, ticks, minValue };
  }, [entries, buffer, plotW, plotH, count, pad.left, pad.top, detailed]);

  const indexFromX = (px: number) => {
    if (count <= 1) return 0;
    const raw = Math.round(((px - pad.left) / plotW) * (count - 1));
    return Math.min(count - 1, Math.max(0, raw));
  };

  const select = (px: number, toggle = false) => {
    const index = indexFromX(px);
    if (toggle && index === selectedIndex) {
      onSelectIndex(null);
      return;
    }
    if (index !== selectedIndex) {
      haptics.selection();
      onSelectIndex(index);
    }
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart((e) => select(e.x))
    .onUpdate((e) => select(e.x));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(400)
    .onEnd((e, success) => {
      if (success) select(e.x, true);
    });
  const gesture = Gesture.Race(pan, tap);

  const labelIndexes = useMemo(() => {
    if (count <= 1) return [0];
    if (count <= 8) return entries.map((_, i) => i);
    return [0, Math.round((count - 1) / 2), count - 1];
  }, [count, entries]);

  const selected = selectedIndex !== null ? entries[selectedIndex] : undefined;
  const lowest = lowestDayIndex !== undefined ? entries.find((e) => e.dayIndex === lowestDayIndex) : undefined;
  const bufferY = geometry.y(buffer);

  const summary = lowest
    ? `Projected balance chart. Lowest balance ${formatMoney(lowest.lowBalance)} on ${formatDate(lowest.date, 'long')}.`
    : 'Projected balance chart.';

  return (
    <GestureDetector gesture={gesture}>
      <View
        testID={testID}
        style={{ height }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={summary}
        accessibilityValue={
          selected
            ? { text: `${formatDate(selected.date, 'weekdayLong')}: ${formatMoney(selected.closingBalance)}` }
            : undefined
        }
        accessibilityHint="Swipe up or down to step through each day."
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const current = selectedIndex ?? -1;
          const next =
            event.nativeEvent.actionName === 'increment'
              ? Math.min(count - 1, current + 1)
              : Math.max(0, current - 1);
          onSelectIndex(next);
        }}>
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.chartFill} stopOpacity={0.16} />
                <Stop offset="1" stopColor={colors.chartFill} stopOpacity={0.01} />
              </LinearGradient>
            </Defs>

            {geometry.ticks.map((tick) => (
              <Line
                key={tick}
                x1={pad.left}
                x2={width - pad.right}
                y1={geometry.y(tick)}
                y2={geometry.y(tick)}
                stroke="#EDEDED"
                strokeWidth={1}
              />
            ))}

            <Path d={geometry.areaPath} fill="url(#balanceFill)" />

            <Line
              x1={pad.left}
              x2={width - pad.right}
              y1={bufferY}
              y2={bufferY}
              stroke={colors.chartBuffer}
              strokeWidth={1.5}
              strokeDasharray="5,4"
            />

            {highlightDayIndexes.map((day) => {
              const i = entries.findIndex((e) => e.dayIndex === day);
              if (i < 0) return null;
              return (
                <Circle
                  key={`hl-${day}`}
                  cx={geometry.x(i)}
                  cy={geometry.y(entries[i].closingBalance)}
                  r={11}
                  fill={colors.red}
                  opacity={0.16}
                />
              );
            })}

            <Path
              d={geometry.linePath}
              fill="none"
              stroke={colors.chartLine}
              strokeWidth={detailed ? 2.5 : 2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {detailed
              ? entries.map((e, i) =>
                  e.transactions.length === 0 ? null : (
                    <Circle
                      key={`ev-${e.date}`}
                      cx={geometry.x(i)}
                      cy={geometry.y(e.closingBalance)}
                      r={e.income > 0 ? 4.5 : 3.5}
                      fill={e.income > 0 ? colors.green : colors.background}
                      stroke={e.income > 0 ? colors.green : colors.chartLine}
                      strokeWidth={2}
                    />
                  ),
                )
              : null}

            {lowest ? (
              <G>
                <Circle
                  cx={geometry.x(entries.indexOf(lowest))}
                  cy={geometry.y(lowest.closingBalance)}
                  r={7}
                  fill={colors.chartLine}
                  opacity={0.18}
                />
                <Circle
                  cx={geometry.x(entries.indexOf(lowest))}
                  cy={geometry.y(lowest.closingBalance)}
                  r={3.8}
                  fill={colors.chartLine}
                />
              </G>
            ) : null}

            {selected && selectedIndex !== null ? (
              <G>
                <Line
                  x1={geometry.x(selectedIndex)}
                  x2={geometry.x(selectedIndex)}
                  y1={pad.top - 6}
                  y2={height - pad.bottom}
                  stroke="#8C8C8C"
                  strokeWidth={1}
                  strokeDasharray="3,3"
                />
                <Circle
                  cx={geometry.x(selectedIndex)}
                  cy={geometry.y(selected.closingBalance)}
                  r={6.5}
                  fill={colors.background}
                  stroke={colors.chartLine}
                  strokeWidth={3}
                />
              </G>
            ) : null}
          </Svg>
        ) : null}

        {detailed && width > 0
          ? geometry.ticks.map((tick) => (
              <Text
                key={`t-${tick}`}
                style={[styles.tick, { top: geometry.y(tick) - 7, width: pad.left - 6 }]}>
                {shortAxisLabel(tick)}
              </Text>
            ))
          : null}

        {width > 0 ? (
          <Text
            style={[
              styles.bufferLabel,
              { top: bufferY - 16, left: pad.left + 2 },
            ]}>
            Buffer {formatMoney(buffer, { decimals: 'auto' })}
          </Text>
        ) : null}

        {width > 0
          ? labelIndexes.map((i) => {
              const isFirst = i === 0;
              const isLast = i === count - 1;
              const daily = count <= 8;
              // Daily view: weekday above the date, centred under each point.
              const [weekday, day] = formatDate(entries[i].date, 'chip').split(' ');
              const label = daily
                ? `${isFirst ? 'Today' : weekday}\n${day}`
                : isFirst
                  ? 'Today'
                  : formatDate(entries[i].date, 'short');
              const anchorLeft = isFirst && !daily;
              const anchorRight = isLast && !daily;
              return (
                <Text
                  key={`x-${i}`}
                  numberOfLines={daily ? 2 : 1}
                  style={[
                    styles.xLabel,
                    {
                      top: height - pad.bottom + 5,
                      left: anchorLeft ? pad.left : anchorRight ? undefined : geometry.x(i) - 22,
                      right: anchorRight ? pad.right : undefined,
                      textAlign: anchorLeft ? 'left' : anchorRight ? 'right' : 'center',
                      width: anchorLeft || anchorRight ? 70 : 44,
                    },
                    selectedIndex === i && styles.xLabelSelected,
                  ]}>
                  {label}
                </Text>
              );
            })
          : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  tick: {
    position: 'absolute',
    left: 0,
    textAlign: 'right',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#8A8A8A',
    fontWeight: '500',
  },
  bufferLabel: {
    position: 'absolute',
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.amber,
  },
  xLabel: {
    position: 'absolute',
    fontSize: 11,
    lineHeight: 13,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  xLabelSelected: { color: colors.textStrong, fontWeight: '700' },
});
