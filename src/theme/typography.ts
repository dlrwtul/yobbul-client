// Yobbul Typography — cf. branding guide section 1.3
// Note: requires Poppins, Inter, JetBrains Mono fonts loaded via expo-font
// For now, fallback to system fonts until expo-font is wired.

export const TYPOGRAPHY = {
  display: { fontFamily: 'Poppins-Bold', fontWeight: '700' as const, fontSize: 32 },
  h1: { fontFamily: 'Poppins-SemiBold', fontWeight: '600' as const, fontSize: 28 },
  h2: { fontFamily: 'Poppins-SemiBold', fontWeight: '600' as const, fontSize: 22 },
  body: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 15 },
  bodyLarge: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 16 },
  label: { fontFamily: 'Inter-Medium', fontWeight: '500' as const, fontSize: 13 },
  price: { fontFamily: 'Poppins-Bold', fontWeight: '700' as const, fontSize: 22 },
  otp: { fontFamily: 'JetBrainsMono-Regular', fontWeight: '400' as const, fontSize: 24 },
  timestamp: { fontFamily: 'Inter-Regular', fontWeight: '400' as const, fontSize: 11 },
};

export const SPACING = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 12: 48, 16: 64,
} as const;

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  lg: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 8,
  },
  orange: {
    shadowColor: '#FF6B2B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
};
