// Theme colors for the app - Modern Violet/Purple Theme (based on academy-chan)
export const colors = {
  // Primary colors - Violet/Purple Modern
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryMuted: '#C4B5FD',

  // Background colors - Dark Premium
  background: '#09090B',
  backgroundLight: '#18181B',
  surface: '#27272A',
  surfaceLight: '#3F3F46',

  // Text colors
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Priority colors
  priorityHigh: '#EF4444',
  priorityMedium: '#F59E0B',
  priorityLow: '#10B981',

  // Status ticket colors
  statusOpen: '#8B5CF6',
  statusPending: '#F59E0B',
  statusResolved: '#10B981',
  statusClosed: '#64748B',

  // Brand colors
  brand: '#8B5CF6',
  brandDark: '#7C3AED',
  brandLight: '#D1FAE5',

  // Other
  border: '#3F3F46',
  borderLight: '#52525B',
  divider: '#27272A',
  overlay: 'rgba(0, 0, 0, 0.75)',

  // Legacy compatibility
  white: '#ffffff',
  black: '#000000',
  gray: '#64748b',
  lightGray: '#94a3b8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadow styles for cards
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  floating: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  brand: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};
