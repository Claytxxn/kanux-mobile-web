// Theme colors for the app - Midnight SaaS Design System
import { colors as tokenColors } from './tokens/colors';

interface ThemeSpacing {
  containerPadding: number;
  stackGapLg: number;
  stackGapMd: number;
  stackGapSm: number;
  inlineGapMd: number;
  inlineGapSm: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ThemeBorderRadius {
  none: number;
  small: number;
  medium: number;
  large: number;
  full: number;
  xs: number;
  sm: number;
  lg: number;
  xl: number;
}

interface ThemeFontSize {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
  displayLg: number;
  displayMd: number;
  displaySm: number;
  headlineLg: number;
  headlineMd: number;
  headlineSm: number;
  titleLg: number;
  titleMd: number;
  titleSm: number;
  labelLg: number;
  labelMd: number;
  labelSm: number;
  bodyLg: number;
  bodyMd: number;
  bodySm: number;
}

interface ThemeFontWeight {
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
}

interface ThemeShadows {
  card: any;
  floating: any;
  brand: any;
}

interface Theme {
  colors: any;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSize: ThemeFontSize;
  fontWeight: ThemeFontWeight;
  shadows: ThemeShadows;
  typography: any;
}

export const colors = {
  // Primary colors - Midnight SaaS
  primary: tokenColors.brand.primary,
  primaryDark: tokenColors.brand.secondary,
  primaryLight: tokenColors.brand.accent,
  primaryMuted: '#93c5fd',

  // Background colors - Midnight SaaS
  background: tokenColors.background.primary,
  backgroundLight: tokenColors.background.secondary,
  surface: tokenColors.background.tertiary,
  surfaceLight: tokenColors.background.elevated,
  surfaceContainer: tokenColors.background.tertiary,
  surfaceContainerLow: tokenColors.background.secondary,
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerHigh: tokenColors.background.elevated,
  surfaceContainerHighest: '#353434',

  // Text colors - Midnight SaaS
  text: tokenColors.text.primary,
  textSecondary: tokenColors.text.secondary,
  textMuted: tokenColors.text.tertiary,

  // Status colors
  success: tokenColors.validation.success,
  warning: tokenColors.validation.warning,
  error: tokenColors.validation.error,
  info: tokenColors.brand.primary,

  // Priority colors
  priorityHigh: tokenColors.validation.error,
  priorityMedium: tokenColors.validation.warning,
  priorityLow: tokenColors.validation.success,

  // Status ticket colors
  statusOpen: tokenColors.brand.primary,
  statusPending: tokenColors.validation.warning,
  statusResolved: tokenColors.validation.success,
  statusClosed: tokenColors.text.tertiary,

  // Brand colors
  brand: tokenColors.brand,
  brandDark: tokenColors.brand.secondary,
  brandLight: tokenColors.brand.accent,

  // Other
  border: tokenColors.border.default,
  borderLight: '#5a5d66',
  divider: '#353434',
  overlay: 'rgba(0, 0, 0, 0.85)',
  
  // Discord-specific (legacy - kept for compatibility)
  mention: '#3b82f620',
  channelIcon: tokenColors.text.tertiary,
  online: tokenColors.status.online,
  idle: tokenColors.validation.warning,
  dnd: tokenColors.validation.error,
  offline: tokenColors.status.offline,
  
  // Basic
  white: '#ffffff',
  black: '#000000',
  gray: tokenColors.text.tertiary,
  lightGray: tokenColors.text.secondary,
};

// =============================================================================
// SPACING - Midnight SaaS Tokens
// =============================================================================

export const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  containerPadding: 16,
  stackGapLg: 24,
  stackGapMd: 16,
  stackGapSm: 8,
  inlineGapMd: 12,
  inlineGapSm: 8,
};

// =============================================================================
// BORDER RADIUS - Midnight SaaS Tokens
// =============================================================================

export const borderRadius: ThemeBorderRadius = {
  none: 0,
  small: 4,
  medium: 8,
  large: 16,
  full: 9999,
  xs: 4,
  sm: 8,
  lg: 16,
  xl: 20,
};

// =============================================================================
// FONT SIZE - Midnight SaaS Typography Scale
// =============================================================================

export const fontSize: ThemeFontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  displayLg: 57,
  displayMd: 45,
  displaySm: 36,
  headlineLg: 32,
  headlineMd: 28,
  headlineSm: 24,
  titleLg: 22,
  titleMd: 16,
  titleSm: 14,
  labelLg: 14,
  labelMd: 12,
  labelSm: 11,
  bodyLg: 16,
  bodyMd: 14,
  bodySm: 12,
};

// =============================================================================
// FONT WEIGHT
// =============================================================================

export const fontWeight: ThemeFontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows: ThemeShadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  floating: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  brand: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  family: 'Inter, system-ui, sans-serif',
};

// =============================================================================
// DEFAULT THEME EXPORT
// =============================================================================

export const theme: Theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  typography,
};