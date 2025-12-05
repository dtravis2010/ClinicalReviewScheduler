/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Texas Health Resources Professional Healthcare Theme
        'thr-blue': {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#005C97', // Primary THR Deep Blue
          600: '#004b7a',
          700: '#003a5e',
          800: '#002942',
          900: '#001829',
        },
        'thr-green': {
          50: '#e8f7f3',
          100: '#d1efe7',
          200: '#a3dfcf',
          300: '#75cfb7',
          400: '#47bf9f',
          500: '#2CA58D', // Primary THR Green
          600: '#238471',
          700: '#1a6355',
          800: '#114238',
          900: '#08211c',
        },
        // Slate gray neutrals for light, airy, non-cluttered layouts
        'slate': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Role-specific accent colors for visual grouping
        'role': {
          'dar': '#3B82F6',     // Blue
          'cr': '#10B981',      // Green
          'fax': '#F97316',     // Orange
          'cpoe': '#8B5CF6',    // Purple
          'float': '#6B7280',   // Gray
          'email': '#EAB308',   // Yellow
          'incoming': '#14B8A6', // Teal
        },
      },
      // Typography sizing system (THR Clean Design)
      fontSize: {
        'h1': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h2': ['1.75rem', { lineHeight: '2rem', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
      },
      // Rounded corners (12-20px for premium feel)
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      // Soft shadows for depth instead of borders
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.1)',
        'soft-md': '0 4px 12px -4px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.12)',
        'soft-lg': '0 8px 24px -8px rgba(0, 0, 0, 0.1), 0 16px 48px -16px rgba(0, 0, 0, 0.15)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(0, 92, 151, 0.15)',
        'glow-green': '0 0 20px rgba(44, 165, 141, 0.15)',
      },
      // Gradient backgrounds
      backgroundImage: {
        'thr-gradient': 'linear-gradient(135deg, #005C97 0%, #003a5e 100%)',
        'thr-gradient-light': 'linear-gradient(135deg, #005C97 0%, #0076bd 100%)',
        'sidebar-gradient': 'linear-gradient(180deg, #005C97 0%, #004b7a 100%)',
      },
      // Large spacing for airy layouts
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      // Animation durations for "alive" interactions
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      // Keyframes for animations
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'hover-glow': {
          '0%, 100%': { boxShadow: '0 0 0 rgba(0, 92, 151, 0)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 92, 151, 0.2)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-out',
        'scale-up': 'scale-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'hover-glow': 'hover-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
