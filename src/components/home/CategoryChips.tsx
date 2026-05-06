import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import { CATEGORIES, type Category } from '../../utils/category';

interface CategoryChipsProps {
  onSelect: (category: Category) => void;
}

export function CategoryChips({ onSelect }: CategoryChipsProps): React.ReactElement {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {CATEGORIES.map((cat, idx) => (
          <Pressable
            key={`${cat.label}-${idx}`}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelect(cat);
            }}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={styles.label}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[2],
    gap: SPACING[3],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    gap: 6,
    ...SHADOWS.sm,
  },
  chipPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  emoji: { fontSize: 16 },
  label: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600' },
});
