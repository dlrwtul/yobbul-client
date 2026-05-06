import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth.store';
import { AuthApi } from '../../api/auth.api';
import { COLORS, TYPOGRAPHY } from '../../theme';

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function SettingRow({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.settingLabel, danger && { color: COLORS.error }]}>{label}</Text>
      {value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : onPress ? (
        <Text style={styles.settingChevron}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export function ProfilScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user, refreshToken, clearSession } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            if (refreshToken) {
              await AuthApi.logout(refreshToken);
            }
          } catch {
            // ignore — clear session regardless
          } finally {
            await clearSession();
          }
        },
      },
    ]);
  }, [refreshToken, clearSession]);

  if (!user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Utilisateur';
  const memberSince = new Date(user.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Avatar name={fullName} />
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
        {user.is_verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Compte vérifié</Text>
          </View>
        )}
      </View>

      <View style={styles.creditsCard}>
        <View>
          <Text style={styles.creditsLabel}>Yobbul Crédits</Text>
          <Text style={styles.creditsValue}>
            {user.yobbul_credits.toLocaleString('fr-FR')} pts
          </Text>
        </View>
        <Text style={styles.creditsIcon}>🎁</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Compte" />
        {user.email ? (
          <SettingRow label="Email" value={user.email} />
        ) : (
          <SettingRow label="Ajouter un email" onPress={() => {}} />
        )}
        <SettingRow label="Téléphone" value={user.phone} />
        <SettingRow label="Membre depuis" value={memberSince} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Préférences" />
        <SettingRow label="Notifications" onPress={() => {}} />
        <SettingRow label="Langue" value="Français" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Aide" />
        <SettingRow label="Centre d'aide" onPress={() => {}} />
        <SettingRow label="Conditions d'utilisation" onPress={() => {}} />
        <SettingRow label="Politique de confidentialité" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.75}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={COLORS.error} />
          ) : (
            <Text style={styles.logoutText}>Déconnexion</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark,
    marginBottom: 4,
  },
  userPhone: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  creditsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navy,
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  creditsLabel: {
    ...TYPOGRAPHY.label,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  creditsValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
  },
  creditsIcon: {
    fontSize: 36,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray400,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.dark,
  },
  settingValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    maxWidth: '55%',
    textAlign: 'right',
  },
  settingChevron: {
    fontSize: 20,
    color: COLORS.gray400,
  },
  logoutButton: {
    margin: 16,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontWeight: '600',
  },
});
