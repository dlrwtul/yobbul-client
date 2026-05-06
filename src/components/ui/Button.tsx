import React from 'react';
import {
  Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS } from '../../theme';

type Variant = 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  pill?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

const HEIGHTS: Record<Size, number> = { sm: 32, md: 40, lg: 48 };
const FONTS: Record<Size, number> = { sm: 12, md: 14, lg: 15 };

export function Button(props: ButtonProps): React.ReactElement {
  const {
    label, onPress, variant = 'primary', size = 'lg',
    loading, disabled, pill = true, style, haptic = true,
  } = props;

  const isDisabled = disabled || loading;

  const onPressWithHaptic = (e: GestureResponderEvent) => {
    if (haptic && !isDisabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!isDisabled) onPress(e);
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    { height: HEIGHTS[size], borderRadius: pill ? RADIUS.full : RADIUS.md },
    variantContainer[variant],
  ];
  if (isDisabled) containerStyle.push(variantDisabled[variant]);
  if (variant === 'primary' && !isDisabled) containerStyle.push(SHADOWS.orange);
  if (style) containerStyle.push(style);

  const textStyle: TextStyle[] = [
    styles.text,
    { fontSize: FONTS[size] },
    variantText[variant],
  ];
  if (isDisabled) textStyle.push({ color: COLORS.gray400 });

  return (
    <Pressable
      onPress={onPressWithHaptic}
      disabled={isDisabled}
      style={({ pressed }) => {
        const arr: ViewStyle[] = [...containerStyle];
        if (pressed && !isDisabled) arr.push(styles.pressed);
        return arr;
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'secondary' ? COLORS.primary : COLORS.white} />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: { fontWeight: '600' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});

const variantContainer: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
  dark: { backgroundColor: COLORS.dark },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.gray200 },
  danger: { backgroundColor: COLORS.error },
};

const variantText: Record<Variant, TextStyle> = {
  primary: { color: COLORS.white },
  secondary: { color: COLORS.primary },
  dark: { color: COLORS.white },
  ghost: { color: COLORS.gray700 },
  danger: { color: COLORS.white },
};

const variantDisabled: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: COLORS.gray100 },
  secondary: { borderColor: COLORS.gray200 },
  dark: { backgroundColor: COLORS.gray100 },
  ghost: { backgroundColor: COLORS.gray100 },
  danger: { backgroundColor: COLORS.gray100 },
};
