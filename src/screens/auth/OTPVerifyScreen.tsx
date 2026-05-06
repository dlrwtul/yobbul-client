import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence,
} from 'react-native-reanimated';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { isAxiosError } from 'axios';
import { Button } from '../../components/ui/Button';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../../theme';
import { AuthApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { maskPhone } from '../../utils/phone';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<AuthStackParamList, 'OTPVerify'>;
type RouteProps = RouteProp<AuthStackParamList, 'OTPVerify'>;

const OTP_LENGTH = 6;
const RESEND_SECONDS = 300; // 5 min

export function OTPVerifyScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const { phone } = route.params;
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);
  const setSession = useAuthStore((s) => s.setSession);

  // Success pulse animation
  const successScale = useSharedValue(0);
  const successOpacity = useSharedValue(0);
  const shake = useSharedValue(0);

  const successStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
    transform: [{ scale: successScale.value }],
  }));
  const containerAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  function handleChange(idx: number, value: string): void {
    const char = value.replace(/\D/g, '').slice(-1); // keep last digit
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError(null);

    if (char) {
      void Haptics.selectionAsync();
      if (idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
      else void verify(next.join(''));
    }
  }

  function handleKeyPress(idx: number, key: string): void {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
    }
  }

  async function verify(code: string): Promise<void> {
    if (code.length !== OTP_LENGTH || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await AuthApi.verifyOtp(phone, code);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Success animation
      successOpacity.value = withTiming(1, { duration: 200 });
      successScale.value = withSpring(1, { damping: 8 });

      // Persist session (RootNavigator will pick it up)
      await setSession(
        {
          access_token: res.access_token,
          refresh_token: res.refresh_token,
          expires_in: res.expires_in,
        },
        res.user,
      );
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Shake animation
      shake.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );

      if (isAxiosError(err) && err.response?.status === 401) {
        const msg = String(err.response.data?.message ?? '');
        setError(msg.includes('expir') ? 'Code expiré, demandez-en un nouveau.' : 'Code incorrect.');
      } else {
        setError('Erreur réseau. Vérifiez votre connexion.');
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(): Promise<void> {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await AuthApi.requestOtp(phone);
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setError('Trop de tentatives. Patientez 10 minutes.');
      } else {
        setError('Impossible de renvoyer le code.');
      }
    } finally {
      setResending(false);
    }
  }

  const mm = Math.floor(countdown / 60).toString().padStart(2, '0');
  const ss = (countdown % 60).toString().padStart(2, '0');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Retour</Text>
        </Pressable>

        <Animated.View style={[styles.content, containerAnim]}>
          <Text style={styles.title}>Code envoyé</Text>
          <Text style={styles.subtitle}>
            au <Text style={styles.phoneHighlight}>{maskPhone(phone)}</Text>
          </Text>

          <View style={styles.otpRow}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[
                  styles.otpCell,
                  d && styles.otpCellFilled,
                  error && styles.otpCellError,
                ]}
                value={d}
                onChangeText={(v) => handleChange(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
          {loading && <Text style={styles.info}>Vérification en cours…</Text>}

          <Animated.View style={[styles.successWrap, successStyle]}>
            <View style={styles.successBadge}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.successText}>Connexion réussie !</Text>
          </Animated.View>

          <View style={styles.resendWrap}>
            {countdown > 0 ? (
              <Text style={styles.countdown}>
                Renvoyer dans <Text style={styles.countdownTime}>{mm}:{ss}</Text>
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                <Text style={[styles.resendLink, resending && styles.resendDisabled]}>
                  {resending ? 'Envoi…' : 'Renvoyer le code'}
                </Text>
              </Pressable>
            )}
          </View>

          <Button
            label="Vérifier"
            onPress={() => verify(digits.join(''))}
            disabled={digits.join('').length !== OTP_LENGTH}
            loading={loading}
            style={{ marginTop: SPACING[8] }}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },
  backBtn: { padding: SPACING[4] },
  backText: { ...TYPOGRAPHY.body, color: COLORS.gray700 },

  content: { flex: 1, paddingHorizontal: SPACING[6], paddingTop: SPACING[6] },
  title: { ...TYPOGRAPHY.h1, color: COLORS.dark, marginBottom: SPACING[2] },
  subtitle: { ...TYPOGRAPHY.bodyLarge, color: COLORS.gray700, marginBottom: SPACING[8] },
  phoneHighlight: { color: COLORS.dark, fontWeight: '600' },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING[6],
  },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    textAlign: 'center',
    ...TYPOGRAPHY.otp,
    color: COLORS.dark,
    backgroundColor: COLORS.white,
  },
  otpCellFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.gray100,
  },
  otpCellError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEE2E2',
  },

  error: { ...TYPOGRAPHY.label, color: COLORS.error, textAlign: 'center' },
  info: { ...TYPOGRAPHY.label, color: COLORS.gray400, textAlign: 'center' },

  successWrap: { alignItems: 'center', marginTop: SPACING[5] },
  successBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successCheck: { fontSize: 32, color: COLORS.white, fontWeight: '700' },
  successText: { ...TYPOGRAPHY.body, color: COLORS.success, marginTop: SPACING[2], fontWeight: '600' },

  resendWrap: { alignItems: 'center', marginTop: SPACING[8] },
  countdown: { ...TYPOGRAPHY.label, color: COLORS.gray400 },
  countdownTime: { color: COLORS.dark, fontWeight: '600' },
  resendLink: { ...TYPOGRAPHY.bodyLarge, color: COLORS.primary, fontWeight: '600' },
  resendDisabled: { color: COLORS.gray400 },
});
