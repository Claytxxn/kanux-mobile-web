/**
 * Kanux Mobile - Design Tokens: Colors
 * Centralized color palette for brand consistency
 */

export const colors = {
  // Brand colors
  brand: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    gradient: ['#8B5CF6', '#6D28D9'] as const,
  },

  // Background colors (dark mode)
  background: {
    primary: '#09090B',
    secondary: '#18181B',
    tertiary: '#27272A',
    elevated: '#3F3F46',
  },

  // Text colors
  text: {
    primary: '#FAFAFA',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
  },

  // Status colors
  status: {
    online: '#10B981',
    offline: '#71717A',
    busy: '#EF4444',
  },

  // Validation colors
  validation: {
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },

  // Border colors
  border: {
    default: '#27272A',
    focused: '#8B5CF6',
    error: '#EF4444',
    success: '#10B981',
  },
} as const;

export type Colors = typeof colors;
