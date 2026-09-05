import { TextStyle } from 'react-native';

/**
 * Type scale inspired by iOS Human Interface Guidelines, rendered in Inter
 * for a consistent premium look across iOS and Android.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type TypeStyle = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TypeStyle> = {
  /** Bespoke oversized numeral for a single full-screen hero display (e.g. the study timer). */
  hero: { fontFamily: fontFamily.bold, fontSize: 64, lineHeight: 72, letterSpacing: 1 },
  largeTitle: { fontFamily: fontFamily.bold, fontSize: 34, lineHeight: 41, letterSpacing: 0.37 },
  title1: { fontFamily: fontFamily.bold, fontSize: 28, lineHeight: 34, letterSpacing: 0.36 },
  title2: { fontFamily: fontFamily.semibold, fontSize: 22, lineHeight: 28, letterSpacing: 0.35 },
  title3: { fontFamily: fontFamily.semibold, fontSize: 20, lineHeight: 25, letterSpacing: 0.38 },
  headline: { fontFamily: fontFamily.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  body: { fontFamily: fontFamily.regular, fontSize: 17, lineHeight: 22, letterSpacing: -0.41 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 16, lineHeight: 21, letterSpacing: -0.3 },
  callout: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 21, letterSpacing: -0.32 },
  subheadline: { fontFamily: fontFamily.regular, fontSize: 15, lineHeight: 20, letterSpacing: -0.24 },
  footnote: { fontFamily: fontFamily.regular, fontSize: 13, lineHeight: 18, letterSpacing: -0.08 },
  caption1: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0 },
  caption2: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 13, letterSpacing: 0.06 },
};

export type TypographyToken = keyof typeof typography;
