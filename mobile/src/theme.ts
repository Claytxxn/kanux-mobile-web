// Theme colors for the app - Discord-inspired Dark Theme
export const colors = {
  // Primary colors - Discord Blurple
  primary: '#5865F2',
  primaryDark: '#4752C4',
  primaryLight: '#7289DA',
  primaryMuted: '#9BA4D4',

  // Background colors - Discord Dark
  background: '#1E1F22',
  backgroundLight: '#2B2D31',
  surface: '#313338',
  surfaceLight: '#383A40',

  // Text colors
  text: '#F2F3F5',
  textSecondary: '#B5BAC1',
  textMuted: '#80848E',

  // Status colors
  success: '#23A559',
  warning: '#F0B232',
  error: '#ED4245',
  info: '#5865F2',

  // Priority colors
  priorityHigh: '#ED4245',
  priorityMedium: '#F0B232',
  priorityLow: '#23A559',

  // Status ticket colors
  statusOpen: '#5865F2',
  statusPending: '#F0B232',
  statusResolved: '#23A559',
  statusClosed: '#80848E',

  // Brand colors
  brand: '#5865F2',
  brandDark: '#4752C4',
  brandLight: '#A5B1F5',

  // Other
  border: '#3F4147',
  borderLight: '#4E5058',
  divider: '#35373C',
  overlay: 'rgba(0, 0, 0, 0.85)',

  // Discord-specific
  mention: '#5865F220',
  channelIcon: '#80848E',
  online: '#23A559',
  idle: '#F0B232',
  dnd: '#ED4245',
  offline: '#80848E',

  // Legacy compatibility
  white: '#ffffff',
  black: '#000000',
  gray: '#80848E',
  lightGray: '#B5BAC1',
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
  xs: 4,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floating: {
    shadowColor: '#5865F2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  brand: {
    shadowColor: '#5865F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};
