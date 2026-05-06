import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { PlacesSearchInput } from '../../components/order/PlacesSearchInput';
import { Button } from '../../components/ui/Button';
import { useLocation } from '../../hooks/useLocation';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { HomeStackParamList, PickupPoint } from '../../navigation/types';

type Nav = StackNavigationProp<HomeStackParamList, 'Pickup'>;
type RouteProps = RouteProp<HomeStackParamList, 'Pickup'>;

export function PickupScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const category = route.params?.category;
  const loc = useLocation();
  const [pickup, setPickup] = useState<PickupPoint | null>(null);
  const [instructionsText, setInstructionsText] = useState('');

  function useCurrentLocation(): void {
    if (!loc.location) return;
    void Haptics.selectionAsync();
    setPickup({
      address: 'Ma position actuelle',
      lat: loc.location.lat,
      lng: loc.location.lng,
    });
  }

  function onContinue(): void {
    if (!pickup) return;
    navigation.navigate('Dropoff', { pickup, category });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Point de collecte</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.label}>Adresse de collecte</Text>
          <PlacesSearchInput
            placeholder="Rue, quartier, bâtiment…"
            autoFocus
            onSelect={(place) => setPickup({ address: place.address, lat: place.lat, lng: place.lng })}
          />

          {loc.permission === 'granted' && loc.location && (
            <Pressable
              style={({ pressed }) => [styles.myLocationBtn, pressed && styles.btnPressed]}
              onPress={useCurrentLocation}
            >
              <Text style={styles.myLocationIcon}>📍</Text>
              <Text style={styles.myLocationText}>Ma position actuelle</Text>
            </Pressable>
          )}
        </View>

        {pickup && pickup.lat !== 0 && pickup.lng !== 0 && (
          <View style={styles.mapPreview}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              region={{
                latitude: pickup.lat,
                longitude: pickup.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                pinColor={COLORS.primary}
                title="Collecte"
              />
            </MapView>
            <View style={styles.mapLabel}>
              <Text style={styles.mapLabelText}>A</Text>
            </View>
          </View>
        )}

        {pickup && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedIcon}>📍</Text>
            <View style={styles.selectedText}>
              <Text style={styles.selectedLabel}>Point de collecte</Text>
              <Text style={styles.selectedAddress} numberOfLines={2}>{pickup.address}</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Instructions livreur <Text style={styles.optional}>(optionnel)</Text></Text>
          <View style={styles.instructionsInput}>
            <Text style={styles.instructionsPlaceholder}>
              {instructionsText || 'Code portail, étage, interphone…'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continuer"
          onPress={onContinue}
          disabled={!pickup}
        />
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
  scrollContent: { padding: SPACING[5], gap: SPACING[5] },

  section: { gap: SPACING[3] },
  label: { ...TYPOGRAPHY.label, color: COLORS.gray700, fontWeight: '600' },
  optional: { color: COLORS.gray400, fontWeight: '400' },

  myLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
  },
  btnPressed: { opacity: 0.75 },
  myLocationIcon: { fontSize: 16 },
  myLocationText: { ...TYPOGRAPHY.body, color: COLORS.primary, fontWeight: '600' },

  mapPreview: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  map: { flex: 1 },
  mapLabel: {
    position: 'absolute',
    top: SPACING[3],
    left: SPACING[3],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLabelText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  selectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF4EE',
    borderRadius: RADIUS.md,
    padding: SPACING[4],
    gap: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  selectedIcon: { fontSize: 20 },
  selectedText: { flex: 1 },
  selectedLabel: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '600' },
  selectedAddress: { ...TYPOGRAPHY.body, color: COLORS.dark, marginTop: 2 },

  instructionsInput: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    padding: SPACING[4],
    minHeight: 60,
  },
  instructionsPlaceholder: { ...TYPOGRAPHY.body, color: COLORS.gray400 },

  footer: {
    padding: SPACING[5],
    paddingBottom: SPACING[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});
