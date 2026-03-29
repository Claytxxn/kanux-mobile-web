export default {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './public/**/*.html',
    './app/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px'
      },
      colors: {
        // Background colors - Modern dark theme
        background: '#09090B',
        foreground: '#FAFAFA',
        card: '#27272A',
        'card-foreground': '#FAFAFA',
        primary: {
          DEFAULT: '#8B5CF6',
          foreground: '#ffffff',
          dark: '#7C3AED',
          light: '#A78BFA'
        },
        secondary: {
          DEFAULT: '#27272A',
          foreground: '#FAFAFA',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#27272A',
          foreground: '#A1A1AA',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#ffffff',
        },
        border: '#3F3F46',
        input: '#3F3F46',
        ring: '#8B5CF6',
        // Brand colors - Violet/Purple (Modern)
        brand: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#A78BFA',
          muted: '#C4B5FD'
        },
        dark: {
          DEFAULT: '#18181B',
          lighter: '#27272A'
        },
        surface: '#09090B',
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
        'brand': '0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.2)',
        'brand-lg': '0 10px 15px -3px rgba(139, 92, 246, 0.4), 0 4px 6px -2px rgba(139, 92, 246, 0.3)',
      },
      keyframes: {
        'fade-in': { 
          from: { opacity: 0 }, 
          to: { opacity: 1 } 
        },
        'pop': { 
          '0%': { transform: 'scale(.98)' }, 
          '100%': { transform: 'scale(1)' } 
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139, 92, 246, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(139, 92, 246, 0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out',
        'pop': 'pop .15s ease-out',
        'slide-up': 'slide-up .3s ease-out',
        'pulse-glow': 'pulse-glow 2s infinite'
      }
    }
  }
};

