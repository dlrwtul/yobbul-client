// Yobbul Brand Colors — cf. branding guide section 1.2
export const COLORS = {
  // Primary palette
  primary: '#FF6B2B',
  primaryLight: '#FF8C42',
  dark: '#1A1A2E',
  navy: '#0F3460',
  white: '#FFFFFF',

  // System / status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Grayscale
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray400: '#9CA3AF',
  gray700: '#374151',
  gray900: '#111827',

  // Transparencies
  overlay: 'rgba(0,0,0,0.5)',
  orangeShadow: 'rgba(255,107,43,0.35)',
} as const;

export type ColorToken = keyof typeof COLORS;
