/**
 * Theme Configuration - Midnight SaaS Design System
 * 
 * Este arquivo exporta o tema unificado baseado nos design tokens.
 * Mantém compatibilidade com o sistema legado para transição suave.
 */

import { colors as tokens, spacing as spacingTokens, roundness, typography as typographyTokens } from './tokens/design-tokens';

// =============================================================================
// TYPES
// =============================================================================

export interface ThemeColors {
  // Primary
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  
  // Background & Surface
  background: string;
  backgroundLight: string;
  surface: string;
  surfaceLight: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  onSurface: string;
  onSurfaceVariant: string;
  
  // Border & Divider
  border: string;
  borderLight: string;
  divider: string;
  outline: string;
  outlineVariant: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  info: string;
  
  // Priority
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  
  // Status Ticket
  statusOpen: string;
  statusPending: string;
  statusResolved: string;
  statusClosed: string;
  
  // Brand
  brand: string;
  brandDark: string;
  brandLight: string;
  
  // Overlay
  overlay: string;
  
  // Discord-specific (legacy)
  mention: string;
  channelIcon: string;
  online: string;
  idle: string;
  dnd: string;
  offline: string;
  
  // Basic
  white: string;
  black: string;
  gray: string;
  lightGray: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  containerPadding: number;
  stackGapLg: number;
  stackGapMd: number;
  stackGapSm: number;
  inlineGapMd: number;
  inlineGapSm: number;
}

export interface ThemeBorderRadius {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
  none: number;
  small: number;
  medium: number;
  large: number;
}

export interface ThemeFontSize {
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

export interface ThemeFontWeight {
  normal: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
}

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ThemeShadows {
  card: ShadowStyle;
  floating: ShadowStyle;
  brand: ShadowStyle;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  fontSize: ThemeFontSize;
  fontWeight: ThemeFontWeight;
  shadows: ThemeShadows;
  typography: {
    family: string;
  };
}

// =============================================================================
// COLORS - Midnight SaaS with Legacy Compatibility
// =============================================================================

export const colors: ThemeColors = {
  // Primary - Updated to Midnight SaaS
  primary: tokens.primary, // '#3b82f6' (era '#5865F2')
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',
  primaryMuted: '#93c5fd',
  onPrimary: tokens.onPrimary,
  primaryContainer: tokens.primaryContainer,
  onPrimaryContainer: tokens.onPrimaryContainer,
  
  // Secondary - New from Midnight SaaS
  secondary: tokens.secondary,
  onSecondary: tokens.onSecondary,
  secondaryContainer: tokens.secondaryContainer,
  onSecondaryContainer: tokens.onSecondaryContainer,
  
  // Tertiary - New from Midnight SaaS
  tertiary: tokens.tertiary,
  onTertiary: tokens.onTertiary,
  tertiaryContainer: tokens.tertiaryContainer,
  onTertiaryContainer: tokens.onTertiaryContainer,
  
  // Background & Surface - Updated to Midnight SaaS
  background: tokens.background, // '#131313' (era '#1E1F22')
  backgroundLight: tokens.surfaceContainerLow,
  surface: tokens.surfaceContainer, // '#1f1f1f' (era '#313338')
  surfaceLight: tokens.surfaceContainerHigh,
  surfaceDim: tokens.surfaceDim,
  surfaceBright: tokens.surfaceBright,
  surfaceContainerLowest: tokens.surfaceContainerLowest,
  surfaceContainerLow: tokens.surfaceContainerLow,
  surfaceContainer: tokens.surfaceContainer,
  surfaceContainerHigh: tokens.surfaceContainerHigh,
  surfaceContainerHighest: tokens.surfaceContainerHighest,
  
  // Text - Updated to Midnight SaaS
  text: tokens.onSurface, // '#e3e2e6' (era '#F2F3F5')
  textSecondary: tokens.onSurfaceVariant, // '#c4c6d0' (era '#B5BAC1')
  textMuted: tokens.outline, // '#8e9099' (era '#80848E')
  onSurface: tokens.onSurface,
  onSurfaceVariant: tokens.onSurfaceVariant,
  
  // Border & Divider - Updated to Midnight SaaS
  border: tokens.outlineVariant, // '#44474f' (era '#3F4147')
  borderLight: tokens.outline,
  divider: tokens.surfaceContainerHighest, // '#353434' (era '#35373C')
  outline: tokens.outline,
  outlineVariant: tokens.outlineVariant,
  
  // Status
  success: tokens.success,
  warning: tokens.warning,
  error: tokens.error,
  onError: tokens.onError,
  errorContainer: tokens.errorContainer,
  onErrorContainer: tokens.onErrorContainer,
  info: tokens.info,
  
  // Priority
  priorityHigh: tokens.error,
  priorityMedium: tokens.warning,
  priorityLow: tokens.success,
  
  // Status Ticket
  statusOpen: tokens.primary,
  statusPending: tokens.warning,
  statusResolved: tokens.success,
  statusClosed: tokens.textMuted,
  
  // Brand
  brand: tokens.primary,
  brandDark: '#2563eb',
  brandLight: '#60a5fa',
  
  // Overlay
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