import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../theme';
import { Button } from '../ui/Button';

interface LocationPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function LocationPermissionModal({
  visible, onAllow, onDeny,
}: LocationPermissionModalProps): React.ReactElement {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDeny}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.title}>Yobbul a besoin de votre position</Text>
          <Text style={styles.description}>
            Pour vous proposer les livreurs les plus proches et préremplir vos adresses,
            Yobbul a besoin d'accéder à votre position GPS.
          </Text>
          <Text style={styles.disclaimer}>
            Votre position n'est utilisée que pour le bon fonctionnement de l'app, jamais partagée.
          </Text>

          <Button
            label="Autoriser la localisation"
            onPress={onAllow}
            style={{ marginTop: SPACING[5] }}
          />

          <Pressable onPress={onDeny} style={styles.laterBtn} hitSlop={8}>
            <Text style={styles.laterText}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING[6],
    alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: SPACING[3] },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    color: COLORS.dark,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
    textAlign: 'center',
    marginTop: SPACING[3],
    lineHeight: 22,
  },
  disclaimer: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING[3],
    fontStyle: 'italic',
  },
  laterBtn: {
    marginTop: SPACING[3],
    padding: SPACING[3],
  },
  laterText: { ...TYPOGRAPHY.body, color: COLORS.gray400 },
});
