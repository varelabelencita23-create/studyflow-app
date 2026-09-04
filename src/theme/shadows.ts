import { ViewStyle } from 'react-native';

/**
 * Soft, low-opacity shadows. Since the app runs on a near-black background,
 * these are mostly used to lift fixed-light surfaces (e.g. subject cards)
 * or elevate floating elements like sheets and floating action buttons.
 */
export const shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'accentGlow', ViewStyle> = {
  none: {},
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 28,
    elevation: 12,
  },
  accentGlow: {
    shadowColor: '#7C6BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
};
