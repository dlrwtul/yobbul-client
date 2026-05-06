import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuthStore } from '../../store/auth.store';
import { COLORS, TYPOGRAPHY } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<AuthStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: { navigation: Nav }): React.ReactElement {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.05, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 250 }),
    );

    const timeout = setTimeout(() => {
      if (!isAuthenticated) {
        navigation.replace('PhoneInput');
      }
      // If authenticated, RootNavigator will swap to AppNavigator automatically
    }, 2000);

    return () => clearTimeout(timeout);
  }, [navigation, opacity, scale, isAuthenticated]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoY}>Y</Text>
        </View>
        <Text style={styles.brandText}>YOBBUL</Text>
        <Text style={styles.tagline}>Ta livraison, en route.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  logoWrap: { alignItems: 'center' },
  logoCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoY: {
    fontSize: 64, fontWeight: '700', color: COLORS.primary,
    fontFamily: TYPOGRAPHY.display.fontFamily,
  },
  brandText: {
    ...TYPOGRAPHY.display,
    color: COLORS.white,
    letterSpacing: 4,
  },
  tagline: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    marginTop: 12,
    opacity: 0.9,
  },
});
