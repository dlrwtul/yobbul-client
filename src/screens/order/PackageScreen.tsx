import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, ScrollView, Switch, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { HomeStackParamList } from '../../navigation/types';
import type { PackageType, VehicleType } from '../../types/order.types';

type Nav = StackNavigationProp<HomeStackParamList, 'Package'>;
type RouteProps = RouteProp<HomeStackParamList, 'Package'>;

interface PackageOption {
  type: PackageType;
  label: string;
  emoji: string;
  hint: string;
}

interface WeightOption {
  label: string;
  price: string;
}

interface VehicleOption {
  type: VehicleType;
  emoji: string;
  name: string;
  desc: string;
}

const PACKAGE_OPTIONS: PackageOption[] = [
  { type: 'standard', label: 'Colis',    emoji: '📦', hint: 'Moins de 20 kg' },
  { type: 'fragile',  label: 'Fragile',  emoji: '🔶', hint: 'Verre, céramique…' },
  { type: 'food',     label: 'Repas',    emoji: '🍔', hint: 'Chaud ou froid' },
  { type: 'document', label: 'Document', emoji: '📄', hint: 'Papiers importants' },
  { type: 'liquid',   label: 'Liquide',  emoji: '🧴', hint: 'Bien emballé' },
  { type: 'standard', label: 'Autre',    emoji: '🎁', hint: 'Tout le reste' },
];

const WEIGHT_OPTIONS: WeightOption[] = [
  { label: '< 1 kg', price: '500 FCFA' },
  { label: '1 – 5 kg', price: '800 FCFA' },
  { label: '5 – 15 kg', price: '1 200 FCFA' },
  { label: '> 15 kg', price: '2 000 FCFA' },
];

const VEHICLE_OPTIONS: VehicleOption[] = [
  { type: 'moto',    emoji: '⚡', name: 'Moto',    desc: 'Express · Le plus rapide' },
  { type: 'bicycle', emoji: '🌿', name: 'Vélo',    desc: 'Éco · Court trajet' },
  { type: 'car',     emoji: '📦', name: 'Voiture', desc: 'Volumineux · Confort' },
];

export function PackageScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const { pickup, dropoff } = route.params;

  const [packageType, setPackageType] = useState<PackageType>('standard');
  const [weightIdx, setWeightIdx] = useState(0);
  const [vehicleType, setVehicleType] = useState<VehicleType>('moto');
  const [isFragile, setIsFragile] = useState(false);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  async function pickPhoto(): Promise<void> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  function onContinue(): void {
    navigation.navigate('Confirm', {
      pickup,
      dropoff,
      packageType,
      vehicleType,
      isFragile,
      requiresSignature,
      photoUri,
    });
  }

  function selectPackage(opt: PackageOption): void {
    void Haptics.selectionAsync();
    setPackageType(opt.type);
    if (opt.type === 'fragile') setIsFragile(true);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Votre colis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Package type grid */}
        <Text style={styles.sectionLabel}>Type de colis</Text>
        <View style={styles.grid}>
          {PACKAGE_OPTIONS.map((opt, idx) => {
            const selected = packageType === opt.type && (opt.type !== 'standard' || idx < 1);
            return (
              <Pressable
                key={`${opt.type}-${idx}`}
                style={[styles.gridItem, selected && styles.gridItemSelected]}
                onPress={() => selectPackage(opt)}
              >
                <Text style={styles.gridEmoji}>{opt.emoji}</Text>
                <Text style={[styles.gridLabel, selected && styles.gridLabelSelected]}>
                  {opt.label}
                </Text>
                <Text style={styles.gridHint}>{opt.hint}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Weight */}
        <Text style={styles.sectionLabel}>Poids estimé</Text>
        <View style={styles.weightRow}>
          {WEIGHT_OPTIONS.map((w, i) => (
            <Pressable
              key={i}
              style={[styles.weightChip, weightIdx === i && styles.weightChipSelected]}
              onPress={() => { void Haptics.selectionAsync(); setWeightIdx(i); }}
            >
              <Text style={[styles.weightLabel, weightIdx === i && styles.weightLabelSelected]}>
                {w.label}
              </Text>
              <Text style={[styles.weightPrice, weightIdx === i && styles.weightLabelSelected]}>
                +{w.price}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Toggles */}
        <View style={styles.togglesCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Fragile</Text>
              <Text style={styles.toggleHint}>Manutention délicate requise</Text>
            </View>
            <Switch
              value={isFragile}
              onValueChange={(v) => { void Haptics.selectionAsync(); setIsFragile(v); }}
              trackColor={{ true: COLORS.primary, false: COLORS.gray200 }}
              thumbColor={COLORS.white}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Signature requise</Text>
              <Text style={styles.toggleHint}>Le destinataire doit signer</Text>
            </View>
            <Switch
              value={requiresSignature}
              onValueChange={(v) => { void Haptics.selectionAsync(); setRequiresSignature(v); }}
              trackColor={{ true: COLORS.primary, false: COLORS.gray200 }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>

        {/* Photo */}
        <Text style={styles.sectionLabel}>Photo du colis <Text style={styles.optional}>(optionnel)</Text></Text>
        <Pressable
          style={({ pressed }) => [styles.photoPicker, pressed && styles.photoPressed]}
          onPress={pickPhoto}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <>
              <Text style={styles.photoIcon}>📷</Text>
              <Text style={styles.photoLabel}>Ajouter une photo</Text>
            </>
          )}
        </Pressable>

        {/* Vehicle selection */}
        <Text style={styles.sectionLabel}>Mode de livraison</Text>
        <View style={styles.vehicleList}>
          {VEHICLE_OPTIONS.map((v) => (
            <Pressable
              key={v.type}
              style={[styles.vehicleRow, vehicleType === v.type && styles.vehicleRowSelected]}
              onPress={() => { void Haptics.selectionAsync(); setVehicleType(v.type); }}
            >
              <Text style={styles.vehicleEmoji}>{v.emoji}</Text>
              <View style={styles.vehicleText}>
                <Text style={[styles.vehicleName, vehicleType === v.type && styles.selectedText]}>
                  {v.name}
                </Text>
                <Text style={styles.vehicleDesc}>{v.desc}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                vehicleType === v.type && styles.radioOuterSelected,
              ]}>
                {vehicleType === v.type && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Voir le récapitulatif" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  back: { ...TYPOGRAPHY.body, color: COLORS.gray700, width: 60 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.dark },

  scroll: { flex: 1 },
  scrollContent: { padding: SPACING[5], paddingBottom: SPACING[8] },
  sectionLabel: { ...TYPOGRAPHY.label, color: COLORS.gray700, fontWeight: '600', marginTop: SPACING[5], marginBottom: SPACING[3] },
  optional: { color: COLORS.gray400, fontWeight: '400' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: SPACING[3],
    gap: 4,
  },
  gridItemSelected: {
    backgroundColor: '#FFF4EE',
    borderColor: COLORS.primary,
  },
  gridEmoji: { fontSize: 28 },
  gridLabel: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600', textAlign: 'center' },
  gridLabelSelected: { color: COLORS.primary },
  gridHint: { ...TYPOGRAPHY.label, fontSize: 10, color: COLORS.gray400, textAlign: 'center' },

  weightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING[2] },
  weightChip: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[2],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 2,
  },
  weightChipSelected: { backgroundColor: '#FFF4EE', borderColor: COLORS.primary },
  weightLabel: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600', textAlign: 'center' },
  weightPrice: { ...TYPOGRAPHY.label, fontSize: 11, color: COLORS.gray400, textAlign: 'center' },
  weightLabelSelected: { color: COLORS.primary },

  togglesCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING[4],
  },
  divider: { height: 1, backgroundColor: COLORS.gray100, marginHorizontal: SPACING[4] },
  toggleLabel: { ...TYPOGRAPHY.body, color: COLORS.dark, fontWeight: '600' },
  toggleHint: { ...TYPOGRAPHY.label, color: COLORS.gray400, marginTop: 2 },

  photoPicker: {
    height: 100,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    gap: SPACING[2],
    overflow: 'hidden',
  },
  photoPressed: { opacity: 0.75 },
  photoIcon: { fontSize: 28 },
  photoLabel: { ...TYPOGRAPHY.body, color: COLORS.gray400 },
  photoPreview: { width: '100%', height: '100%' },

  vehicleList: { gap: SPACING[3] },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    gap: SPACING[4],
    ...SHADOWS.sm,
  },
  vehicleRowSelected: { borderColor: COLORS.primary, backgroundColor: '#FFF4EE' },
  vehicleEmoji: { fontSize: 28 },
  vehicleText: { flex: 1 },
  vehicleName: { ...TYPOGRAPHY.bodyLarge, color: COLORS.dark, fontWeight: '600' },
  selectedText: { color: COLORS.primary },
  vehicleDesc: { ...TYPOGRAPHY.label, color: COLORS.gray400, marginTop: 2 },

  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: COLORS.primary },
  radioInner: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.primary,
  },

  footer: {
    padding: SPACING[5],
    paddingBottom: SPACING[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});
