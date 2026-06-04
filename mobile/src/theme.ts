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
  
  // Discord-specific (legacy)
  mention: '#5865F220',
  channelIcon: tokens.textMuted,
  online: tokens.success,
  idle: tokens.warning,
  dnd: tokens.error,
  offline: tokens.textMuted,
  
  // Basic
  white: '#ffffff',
  black: '#000000',
  gray: tokens.textMuted,
  lightGray: tokens.textSecondary,
};

// =============================================================================
// SPACING - Semantic Naming with Legacy Compatibility
// =============================================================================

export const spacing: ThemeSpacing = {
  // Legacy compatibility
  xs: spacingTokens.xs,
  sm: spacingTokens.sm,
  md: spacingTokens.md,
  lg: spacingTokens.lg,
  xl: spacingTokens.xl,
  xxl: spacingTokens.xxl,
  
  // New semantic naming
  containerPadding: spacingTokens.containerPadding,
  stackGapLg: spacingTokens.stackGapLg,
  stackGapMd: spacingTokens.stackGapMd,
  stackGapSm: spacingTokens.stackGapSm,
  inlineGapMd: spacingTokens.inlineGapMd,
  inlineGapSm: spacingTokens.inlineGapSm,
};

// =============================================================================
// BORDER RADIUS - Semantic Naming with Legacy Compatibility
// =============================================================================

export const borderRadius: ThemeBorderRadius = {
  // Legacy compatibility
  xs: roundness.xs,
  sm: roundness.sm,
  md: roundness.medium, // Updated: 12 → 8
  lg: roundness.large,
  xl: roundness.xl,
  full: roundness.full,
  
  // New semantic naming
  none: roundness.none,
  small: roundness.small,
  medium: roundness.medium,
  large: roundness.large,
};

// =============================================================================
// FONT SIZE - With Typography Scale
// =============================================================================

export const fontSize: ThemeFontSize = {
  // Legacy compatibility
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  
  // Typography scale from Midnight SaaS
  displayLg: typographyTokens.scale.displayLg,
  displayMd: typographyTokens.scale.displayMd,
  displaySm: typographyTokens.scale.displaySm,
  headlineLg: typographyTokens.scale.headlineLg,
  headlineMd: typographyTokens.scale.headlineMd,
  headlineSm: typographyTokens.scale.headlineSm,
  titleLg: typographyTokens.scale.titleLg,
  titleMd: typographyTokens.scale.titleMd,
  titleSm: typographyTokens.scale.titleSm,
  labelLg: typographyTokens.scale.labelLg,
  labelMd: typographyTokens.scale.labelMd,
  labelSm: typographyTokens.scale.labelSm,
  bodyLg: typographyTokens.scale.bodyLg,
  bodyMd: typographyTokens.scale.bodyMd,
  bodySm: typographyTokens.scale.bodySm,
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