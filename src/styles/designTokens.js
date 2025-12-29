/**
 * Design Tokens - Central source of truth for design values
 * Clinical Review Scheduler Design System
 */

export const colors = {
  // Brand Colors
  primary: {
    50: '#E6F2F8',
    100: '#CCE5F1',
    200: '#99CBE3',
    300: '#66B1D5',
    400: '#3397C7',
    500: '#005C97', // Main brand blue
    600: '#004A7A',
    700: '#00385C',
    800: '#00263D',
    900: '#00131F',
  },

  secondary: {
    50: '#E9F7E6',
    100: '#D3EFCD',
    200: '#A7DF9B',
    300: '#7BCF69',
    400: '#4FBF37',
    500: '#43B02A', // Main brand green
    600: '#378F22',
    700: '#2A6D1A',
    800: '#1C4A11',
    900: '#0E2709',
  },

  // Semantic Colors
  success: {
    light: '#D3EFCD',
    main: '#43B02A',
    dark: '#2A6D1A',
  },

  error: {
    light: '#FEE2E2',
    main: '#DC2626',
    dark: '#991B1B',
  },

  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },

  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1E40AF',
  },

  // Role-Based Colors
  roles: {
    dar: '#005C97',      // Blue
    cpoe: '#9333EA',     // Purple
    trace: '#43B02A',    // Green
    float: '#F59E0B',    // Orange
  },

  // Workload Indicators
  workload: {
    normal: '#3B82F6',      // Blue
    overloaded: '#DC2626',  // Red
    underutilized: '#F59E0B', // Yellow
  },

  // Neutral Colors (Tailwind-based)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  slate: {
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
};

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
};

export const typography = {
  fonts: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    mono: "'Consolas', 'Monaco', 'Courier New', monospace",
  },

  sizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  'soft-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'soft-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'soft-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  glow: '0 0 15px rgba(0, 92, 151, 0.3)',
  'glow-green': '0 0 15px rgba(67, 176, 42, 0.3)',
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const transitions = {
  durations: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },

  timings: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Touch targets (WCAG AAA compliance)
export const touchTargets = {
  minimum: '44px',  // WCAG minimum
  comfortable: '48px',
  large: '56px',
};

// Animation keyframes
export const animations = {
  fadeIn: 'fadeIn 200ms ease-out',
  slideInUp: 'slideInUp 300ms ease-out',
  slideInDown: 'slideInDown 300ms ease-out',
  scaleIn: 'scaleIn 200ms ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};
