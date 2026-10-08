import type { TextStyle } from 'react-native';

/** Palette sampled from the CIBC Mobile Banking reference screenshot. */
export const colors = {
  red: '#C41F3E',
  redPressed: '#A3172F',
  redTint: '#FBECEF',
  burgundy: '#8B1D41',

  text: '#262626',
  textStrong: '#1A1A1A',
  textSecondary: '#555555',
  textTertiary: '#6B6B6B',
  textOnRed: '#FFFFFF',

  background: '#FFFFFF',
  surface: '#F3F3F3',
  surfaceAlt: '#F7F7F7',
  border: '#DDDDDD',
  borderLight: '#E8E8E8',
  divider: '#E6E6E6',

  green: '#1C7A4C',
  greenTint: '#E6F3EC',
  amber: '#8F5300',
  amberTint: '#FFF3DF',
  blue: '#2D5786',
  blueTint: '#E7EFF8',
  alert: '#B3142F',
  alertTint: '#FCEAED',

  chartLine: '#8B1D41',
  chartFill: '#C41F3E',
  chartBuffer: '#C9822B',
  disabled: '#D9D9D9',
  disabledText: '#7A7A7A',
  scrim: 'rgba(15, 15, 15, 0.42)',
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

/** Native iOS text styles (SF Pro via the system font). */
export const type = {
  largeTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.4 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.2 },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subhead: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  section: { fontSize: 14, lineHeight: 18, fontWeight: '500', letterSpacing: 2.6 },
  eyebrow: { fontSize: 11.5, lineHeight: 14, fontWeight: '700', letterSpacing: 1.1 },
} satisfies Record<string, TextStyle>;

/** Tabular figures keep amounts from jittering while they animate. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const shadow = {
  card: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  floating: { boxShadow: '0 8px 28px rgba(0,0,0,0.14)' },
  pill: { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
} as const;

/** Space reserved at the bottom of tab screens for the floating tab bar. */
export const TAB_BAR_HEIGHT = 66;
