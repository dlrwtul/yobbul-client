import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';

interface SearchBarProps {
  onPress: () => void;
  placeholder?: string;
}

export function SearchBar({
  onPress, placeholder = 'Où dois-je livrer ?',
}: SearchBarProps): React.ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
    >
      <Text style={styles.icon}>🔍</Text>
      <Text style={styles.placeholder}>{placeholder}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    gap: SPACING[3],
    marginHorizontal: SPACING[5],
    marginVertical: SPACING[3],
    ...SHADOWS.md,
  },
  pressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },
  icon: { fontSize: 18 },
  placeholder: { ...TYPOGRAPHY.bodyLarge, color: COLORS.gray400, flex: 1 },
});
