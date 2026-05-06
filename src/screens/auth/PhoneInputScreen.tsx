import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Modal, FlatList, Pressable,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import { isAxiosError } from 'axios';
import { Button } from '../../components/ui/Button';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../../theme';
import {
  CEDEAO_COUNTRIES, DEFAULT_COUNTRY, formatLocalPhone, buildE164,
  type CountryOption,
} from '../../utils/phone';
import { AuthApi } from '../../api/auth.api';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<AuthStackParamList, 'PhoneInput'>;

export function PhoneInputScreen({ navigation }: { navigation: Nav }): React.ReactElement {
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length === country.maxLocalLen;

  async function onSubmit(): Promise<void> {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);
    const e164 = buildE164(country.dialCode, digits);

    try {
      await AuthApi.requestOtp(e164);
      navigation.navigate('OTPVerify', { phone: e164 });
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setError('Trop de tentatives, réessayez dans 10 minutes.');
      } else {
        setError('Impossible d\'envoyer le code. Vérifiez votre connexion.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Entrez votre numéro</Text>
          <Text style={styles.subtitle}>
            Nous vous enverrons un code à 6 chiffres par SMS.
          </Text>

          <View style={styles.inputRow}>
            <Pressable
              style={styles.countrySelector}
              onPress={() => setShowPicker(true)}
            >
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={styles.dialCode}>{country.dialCode}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>

            <TextInput
              style={styles.phoneInput}
              value={formatLocalPhone(phone, country.code)}
              onChangeText={(t) => setPhone(t)}
              placeholder="77 123 45 67"
              placeholderTextColor={COLORS.gray400}
              keyboardType="phone-pad"
              maxLength={country.maxLocalLen + 4}
              autoFocus
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Recevoir le code"
            onPress={onSubmit}
            disabled={!isValid}
            loading={loading}
            style={{ marginTop: SPACING[8] }}
          />

          <Text style={styles.disclaimer}>
            En continuant, vous acceptez nos{' '}
            <Text style={styles.link}>Conditions d'utilisation</Text> et notre{' '}
            <Text style={styles.link}>Politique de confidentialité</Text>.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showPicker}
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un pays</Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Text style={styles.modalClose}>Fermer</Text>
            </Pressable>
          </View>
          <FlatList
            data={CEDEAO_COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.countryRow,
                  country.code === item.code && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setCountry(item);
                  setPhone('');
                  setShowPicker(false);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDial}>{item.dialCode}</Text>
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: SPACING[6], paddingTop: SPACING[12] },

  title: { ...TYPOGRAPHY.h1, color: COLORS.dark, marginBottom: SPACING[2] },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.gray700, marginBottom: SPACING[8] },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[4],
    borderRightWidth: 1,
    borderRightColor: COLORS.gray200,
    backgroundColor: COLORS.gray100,
    gap: 6,
  },
  flag: { fontSize: 22 },
  dialCode: { ...TYPOGRAPHY.bodyLarge, color: COLORS.dark, fontWeight: '600' },
  chevron: { fontSize: 12, color: COLORS.gray400 },

  phoneInput: {
    flex: 1,
    paddingHorizontal: SPACING[4],
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.dark,
    minHeight: 52,
  },

  error: {
    ...TYPOGRAPHY.label,
    color: COLORS.error,
    marginTop: SPACING[3],
  },
  disclaimer: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING[8],
    lineHeight: 18,
  },
  link: { color: COLORS.primary, fontWeight: '600' },

  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: { ...TYPOGRAPHY.h2, color: COLORS.dark },
  modalClose: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '600' },

  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING[4],
    paddingHorizontal: SPACING[5],
    gap: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  countryRowSelected: { backgroundColor: COLORS.gray100 },
  countryName: { flex: 1, ...TYPOGRAPHY.body, color: COLORS.dark },
  countryDial: { ...TYPOGRAPHY.body, color: COLORS.gray400, fontWeight: '600' },
});
