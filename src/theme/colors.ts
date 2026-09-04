/**
 * StudyFlow color system.
 * Dark mode only. Single accent (blue-violet). Gray is reserved for
 * secondary information. Semantic colors are used sparingly for status only.
 */
export const colors = {
  // Backgrounds
  background: '#000000',
  backgroundElevated: '#0B0B0D',
  surface: '#161618',
  surfaceElevated: '#1E1E22',
  surfaceHighlight: '#26262B',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',
  separator: 'rgba(255,255,255,0.06)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA4',
  textTertiary: '#68686F',
  textInverse: '#0A0A0C',

  // Accent — the single brand color
  accent: '#7C6BFF',
  accentPressed: '#6A5AE0',
  accentSubtle: 'rgba(124,107,255,0.14)',
  accentBorder: 'rgba(124,107,255,0.35)',

  // Semantic (used only for status, never decoration)
  success: '#32D74B',
  successSubtle: 'rgba(50,215,75,0.14)',
  warning: '#FF9F0A',
  warningSubtle: 'rgba(255,159,10,0.14)',
  danger: '#FF453A',
  dangerSubtle: 'rgba(255,69,58,0.14)',

  // Fixed-light surfaces (e.g. weekly planner subject cards)
  onLightSurface: '#FFFFFF',
  onLightText: '#0A0A0C',
  onLightTextSecondary: '#6B6B72',

  overlay: 'rgba(0,0,0,0.6)',
  overlaySoft: 'rgba(0,0,0,0.35)',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
