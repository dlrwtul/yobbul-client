import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../theme';

interface HomeHeaderProps {
  firstName: string;
  avatarUrl?: string | null;
}

export function HomeHeader({ firstName, avatarUrl }: HomeHeaderProps): React.ReactElement {
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?';

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
        <Text style={styles.subtitle}>Où voulez-vous livrer aujourd'hui ?</Text>
      </View>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitial}>{initial}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
  },
  greeting: { ...TYPOGRAPHY.h2, color: COLORS.dark },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.gray400, marginTop: 2 },
  avatar: {
    width: 44, height: 44, borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 44, height: 44 },
  avatarInitial: { ...TYPOGRAPHY.bodyLarge, color: COLORS.white, fontWeight: '700' },
});
