import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { Promo } from '../../api/promos.api';

interface PromoBannerProps {
  promo: Promo;
  onPress: (promo: Promo) => void;
}

export function PromoBanner({ promo, onPress }: PromoBannerProps): React.ReactElement {
  const bg = promo.background_color || COLORS.primary;
  return (
    <Pressable
      style={({ pressed }) => [styles.banner, { backgroundColor: bg }, pressed && styles.pressed]}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(promo);
      }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{promo.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>
          {promo.description}
        </Text>
        <View style={styles.ctaWrap}>
          <Text style={styles.cta}>{promo.cta} →</Text>
        </View>
      </View>
      <View style={styles.discountBubble}>
        <Text style={styles.discountText}>{promo.discount_label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING[5],
    borderRadius: RADIUS.lg,
    padding: SPACING[5],
    marginBottom: SPACING[4],
    ...SHADOWS.md,
  },
  pressed: { opacity: 0.9 },
  content: { flex: 1, paddingRight: SPACING[3] },
  title: { ...TYPOGRAPHY.h2, fontSize: 18, color: COLORS.white },
  desc: { ...TYPOGRAPHY.body, color: COLORS.white, opacity: 0.9, marginTop: 4 },
  ctaWrap: { marginTop: SPACING[3] },
  cta: { ...TYPOGRAPHY.label, color: COLORS.white, fontWeight: '700' },
  discountBubble: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  discountText: { ...TYPOGRAPHY.label, color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
