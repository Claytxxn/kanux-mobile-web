/**
 * Design Tokens - Midnight SaaS Design System
 * Baseado no documento design-kanuxpro.md
 * 
 * Este arquivo define todos os tokens de design do sistema
 * com tipagem estrita e compatibilidade com o sistema legado.
 */

// =============================================================================
// TYPES
// =============================================================================

export type ColorHex = `#${string}`;

export interface ColorPalette {
  // Surface colors
  surface: ColorHex;
  surfaceDim: ColorHex;
  surfaceBright: ColorHex;
  surfaceContainerLowest: ColorHex;
  surfaceContainerLow: ColorHex;
  surfaceContainer: ColorHex;
  surfaceContainerHigh: ColorHex;
  surfaceContainerHighest: ColorHex;
  
  // On-surface colors
  onSurface: ColorHex;
  onSurfaceVariant: ColorHex;
  
  // Outline colors
  outline: ColorHex;
  outlineVariant: ColorHex;
  
  // Primary colors
  primary: ColorHex;
  onPrimary: ColorHex;
  primaryContainer: ColorHex;
  onPrimaryContainer: ColorHex;
  
  // Secondary colors
  secondary: ColorHex;
  onSecondary: ColorHex;
  secondaryContainer: ColorHex;
  onSecondaryContainer: ColorHex;
  
  // Tertiary colors
  tertiary: ColorHex;
  onTertiary: ColorHex;
  tertiaryContainer: ColorHex;
  onTertiaryContainer: ColorHex;
  
  // Error colors
  error: ColorHex;
  onError: ColorHex;
  errorContainer: ColorHex;
  onErrorContainer: ColorHex;
  
  // Legacy compatibility
  background: ColorHex;
  text: ColorHex;
  textSecondary: ColorHex;
  textMuted: ColorHex;
  border: ColorHex;
  divider: ColorHex;
  success: ColorHex;
  warning: ColorHex;
  info: ColorHex;
}

export interface SpacingTokens {
  containerPadding: number;
  stackGapLg: number;
  stackGapMd: number;
  stackGapSm: number;
  inlineGapMd: number;
  inlineGapSm: number;
  
  // Legacy compatibility
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface RoundnessTokens {
  none: number;
  small: number;
  medium: number;
  large: number;
  full: number;
  
  // Legacy compatibility
  xs: number;
  sm: number;
  lg: number;
  xl: number;
}

export interface TypographyScale {
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

export interface TypographyTokens {
  family: string;
  scale: TypographyScale;
}

// =============================================================================
// COLOR TOKENS - Midnight SaaS
// =============================================================================

export const colors: ColorPalette = {
  // Surface colors
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceBright: '#393939',
  surfaceContainerLowest: '#0e0e0e',
  surfaceContainerLow: '#1c1b1b',
  surfaceContainer: '#1f1f1f',
  surfaceContainerHigh: '#2a2929',
  surfaceContainerHighest: '#353434',
  
  // On-surface colors
  onSurface: '#e3e2e6',
  onSurfaceVariant: '#c4c6d0',
  
  // Outline colors
  outline: '#8e9099',
  outlineVariant: '#44474f',
  
  // Primary colors
  primary: '#3b82f6',
  onPrimary: '#ffffff',
  primaryContainer: '#004494',
  onPrimaryContainer: '#d8e2ff',
  
  // Secondary colors
  secondary: '#bfc6dc',
  onSecondary: '#293041',
  secondaryContainer: '#3f4759',
  onSecondaryContainer: '#dbe2f9',
  
  // Tertiary colors
  tertiary: '#debcdf',
  onTertiary: '#402843',
  tertiaryContainer: '#583e5b',
  onTertiaryContainer: '#fbd7fc',
  
  // Error colors
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
  
  // Legacy compatibility
  background: '#131313',
  text: '#e3e2e6',
  textSecondary: '#c4c6d0',
  textMuted: '#8e9099',
  border: '#44474f',
  divider: '#353434',
  success: '#23A559',
  warning: '#F0B232',
  info: '#3b82f6',
};

// =============================================================================
// SPACING TOKENS
// =============================================================================

export const spacing: SpacingTokens = {
  // New semantic naming
  containerPadding: 16,
  stackGapLg: 24,
  stackGapMd: 16,
  stackGapSm: 8,
  inlineGapMd: 12,
  inlineGapSm: 8,
  
  // Legacy compatibility
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// =============================================================================
// ROUNDNESS TOKENS
// =============================================================================

export const roundness: RoundnessTokens = {
  // New semantic naming
  none: 0,
  small: 4,
  medium: 8,
  large: 16,
  full: 9999,
  
  // Legacy compatibility
  xs: 4,
  sm: 8,
  lg: 16,
  xl: 20,
};

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography: TypographyTokens = {
  family: 'Inter, system-ui, sans-serif',
  scale: {
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
  },
};

// =============================================================================
// EXPORTS
// =============================================================================

export type Colors = ColorPalette;
export type Spacing = SpacingTokens;
export type Roundness = RoundnessTokens;
export type Typography = TypographyTokens;