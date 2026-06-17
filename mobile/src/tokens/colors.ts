/**
 * Kanux Mobile - Design Tokens: Colors
 * Midnight SaaS Design System
 */

export const colors = {
  // Brand colors - Midnight SaaS
  brand: {
    primary: '#3b82f6',
    secondary: '#2563eb',
    accent: '#60a5fa',
    gradient: ['#3b82f6', '#2563eb'] as const,
  },

  // Background colors - Midnight SaaS
  background: {
    primary: '#131313',
    secondary: '#1c1b1b',
    tertiary: '#1f1f1f',
    elevated: '#2a2929',
  },

  // Text colors - Midnight SaaS
  text: {
    primary: '#e3e2e6',
    secondary: '#c4c6d0',
    tertiary: '#8e9099',
  },

  // Status colors
  status: {
    online: '#23A559',
    offline: '#8e9099',
    busy: '#ED4245',
  },

  // Validation colors
  validation: {
    error: '#ffb4ab',
    success: '#23A559',
    warning: '#F0B232',
  },

  // Border colors - Midnight SaaS
  border: {
    default: '#44474f',
    focused: '#3b82f6',
    error: '#ffb4ab',
    success: '#23A559',
  },
} as const;

export type Colors = typeof colors;
