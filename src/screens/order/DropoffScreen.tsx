import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { PlacesSearchInput } from '../../components/order/PlacesSearchInput';
import { Button } from '../../components/ui/Button';
import { useLocation } from '../../hooks/useLocation';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { HomeStackParamList, PickupPoint } from '../../navigation/types';

type Nav = StackNavigationProp<HomeStackParamList, 'Dropoff'>;
type RouteProps = RouteProp<HomeStackParamList, 'Dropoff'>;

export function DropoffScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const { pickup, category } = route.params;
  const loc = useLocation();
  const [dropoff, setDropoff] = useState<PickupPoint | null>(null);

  const bothPoints = pickup.lat !== 0 && dropoff && dropoff.lat !== 0;

  function midRegion() {
    if (!bothPoints || !dropoff) return null;
    return {
      latitude: (pickup.lat + dropoff.lat) / 2,
      longitude: (pickup.lng + dropoff.lng) / 2,
      latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 2.5 + 0.02,
      longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 2.5 + 0.02,
    };
  }

  function onContinue(): void {
    if (!dropoff) return;
    navigation.navigate('Package', { pickup, dropoff });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Destination</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pickup reminder */}
        <View style={styles.pickupReminder}>
          <View style={styles.pinDotA} />
          <Text style={styles.pickupAddress} numberOfLines={1}>{pickup.address}</Text>
        </View>

        <View style={styles.dividerLine} />

        {/* Dropoff input */}
        <View style={styles.section}>
          <Text style={styles.label}>Adresse de livraison</Text>
          <PlacesSearchInput
            placeholder="Où livrer ?"
            autoFocus
            onSelect={(place) => setDropoff({ address: place.address, lat: place.lat, lng: place.lng })}
          />
        </View>

        {/* Map with both pins */}
        {bothPoints && dropoff && midRegion() && (
          <View style={styles.mapPreview}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={styles.map}
              region={midRegion()!}
              scrollEnabled={false}
              zoomEnabled={false}
              toolbarEnabled={false}
            >
              <Marker
                coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
                pinColor={COLORS.primary}
                title="Collecte"
              />
              <Marker
                coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }}
                pinColor={COLORS.navy}
                title="Livraison"
              />
              <Polyline
                coordinates={[
                  { latitude: pickup.lat, longitude: pickup.lng },
                  { latitude: dropoff.lat, longitude: dropoff.lng },
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[6, 4]}
              />
            </MapView>
            <View style={[styles.mapLabel, styles.labelA]}>
              <Text style={styles.mapLabelText}>A</Text>
            </View>
            <View style={[styles.mapLabel, styles.labelB]}>
              <Text style={styles.mapLabelText}>B</Text>
            </View>
          </View>
        )}

        {dropoff && (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedIcon}>🏁</Text>
            <View style={styles.selectedText}>
              <Text style={styles.selectedLabel}>Destination</Text>
              <Text style={styles.selectedAddress} numberOfLines={2}>{dropoff.address}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Continuer"
          onPress={onContinue}
          disabled={!dropoff}
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
  scrollContent: { padding: SPACING[5], gap: SPACING[4] },

  pickupReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    paddingVertical: SPACING[2],
  },
  pinDotA: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.white,
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 4, elevation: 2,
  },
  pickupAddress: { ...TYPOGRAPHY.body, color: COLORS.gray700, flex: 1 },

  dividerLine: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginLeft: SPACING[3],
  },

  section: { gap: SPACING[3] },
  label: { ...TYPOGRAPHY.label, color: COLORS.gray700, fontWeight: '600' },

  mapPreview: {
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  map: { flex: 1 },
  mapLabel: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  labelA: { top: SPACING[3], left: SPACING[3], backgroundColor: COLORS.primary },
  labelB: { bottom: SPACING[3], right: SPACING[3], backgroundColor: COLORS.navy },
  mapLabelText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  selectedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: RADIUS.md,
    padding: SPACING[4],
    gap: SPACING[3],
    borderWidth: 1,
    borderColor: COLORS.navy,
  },
  selectedIcon: { fontSize: 20 },
  selectedText: { flex: 1 },
  selectedLabel: { ...TYPOGRAPHY.label, color: COLORS.navy, fontWeight: '600' },
  selectedAddress: { ...TYPOGRAPHY.body, color: COLORS.dark, marginTop: 2 },

  footer: {
    padding: SPACING[5],
    paddingBottom: SPACING[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});
