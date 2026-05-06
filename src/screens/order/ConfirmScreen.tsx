import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { Button } from '../../components/ui/Button';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import { OrdersApi } from '../../api/orders.api';
import { truncate } from '../../utils/date';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<HomeStackParamList, 'Confirm'>;
type RouteProps = RouteProp<HomeStackParamList, 'Confirm'>;

type PaymentMethod = 'wave' | 'orange_money' | 'cash' | 'credits';

const PAYMENT_METHODS: { id: PaymentMethod; label: string; emoji: string }[] = [
  { id: 'wave',         label: 'Wave',          emoji: '🔵' },
  { id: 'orange_money', label: 'Orange Money',   emoji: '🟠' },
  { id: 'cash',         label: 'Cash',           emoji: '💵' },
  { id: 'credits',      label: 'Crédits Yobbul', emoji: '⭐' },
];

const PACKAGE_LABELS: Record<string, string> = {
  standard: 'Colis standard',
  fragile: 'Colis fragile',
  food: 'Repas',
  document: 'Document',
  liquid: 'Liquide',
};

const VEHICLE_LABELS: Record<string, string> = {
  moto: '⚡ Moto Express',
  bicycle: '🌿 Vélo Éco',
  car: '📦 Voiture Volumineux',
  tricycle: '🛺 Tricycle',
};

export function ConfirmScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const draft = route.params;
  const { pickup, dropoff, packageType, vehicleType, isFragile, requiresSignature } = draft;

  const [payment, setPayment] = useState<PaymentMethod>('wave');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const { data: estimate, isLoading: estimating, isError } = useQuery({
    queryKey: ['estimate', pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, packageType, vehicleType],
    queryFn: () => OrdersApi.estimate({
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      dropoff_lat: dropoff.lat,
      dropoff_lng: dropoff.lng,
      package_type: packageType,
      vehicle_type: vehicleType,
    }),
    staleTime: Infinity,
    retry: 2,
  });

  const mapRegion = {
    latitude: (pickup.lat + dropoff.lat) / 2,
    longitude: (pickup.lng + dropoff.lng) / 2,
    latitudeDelta: Math.abs(pickup.lat - dropoff.lat) * 2.5 + 0.02,
    longitudeDelta: Math.abs(pickup.lng - dropoff.lng) * 2.5 + 0.02,
  };

  async function onOrder(): Promise<void> {
    if (ordering || !estimate) return;
    setOrdering(true);
    setOrderError(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const order = await OrdersApi.create({
        pickup_address: pickup.address,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        dropoff_address: dropoff.address,
        dropoff_lat: dropoff.lat,
        dropoff_lng: dropoff.lng,
        package_type: packageType,
        vehicle_type: vehicleType,
        is_fragile: isFragile,
        requires_signature: requiresSignature,
        payment_method: payment,
        photo_url: draft.photoUri,
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('Tracking', { orderId: order.id });
    } catch {
      setOrderError('Impossible de passer la commande. Vérifiez votre connexion.');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setOrdering(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Confirmation</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            region={mapRegion}
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
              strokeWidth={4}
            />
          </MapView>
        </View>

        {/* Route summary card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pinA}><Text style={styles.pinLabel}>A</Text></View>
            <Text style={styles.routeAddress} numberOfLines={2}>{truncate(pickup.address, 50)}</Text>
          </View>
          <View style={styles.routeDivider} />
          <View style={styles.routeRow}>
            <View style={styles.pinB}><Text style={styles.pinLabel}>B</Text></View>
            <Text style={styles.routeAddress} numberOfLines={2}>{truncate(dropoff.address, 50)}</Text>
          </View>
        </View>

        {/* Package + vehicle summary */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type de colis</Text>
            <Text style={styles.detailValue}>
              {PACKAGE_LABELS[packageType] ?? packageType}
              {isFragile ? ' · Fragile' : ''}
              {requiresSignature ? ' · Signature' : ''}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Véhicule</Text>
            <Text style={styles.detailValue}>{VEHICLE_LABELS[vehicleType] ?? vehicleType}</Text>
          </View>
        </View>

        {/* Price + ETA */}
        <View style={styles.priceCard}>
          {estimating ? (
            <View style={styles.skeletonWrap}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.estimatingText}>Calcul du prix…</Text>
            </View>
          ) : isError || !estimate ? (
            <View style={styles.skeletonWrap}>
              <Text style={styles.errorText}>Estimation indisponible</Text>
            </View>
          ) : (
            <>
              <View style={styles.priceMain}>
                <Text style={styles.priceBig}>
                  {estimate.final_price.toLocaleString('fr-FR')} FCFA
                </Text>
                <Text style={styles.etaText}>
                  Entre {estimate.eta_min} et {estimate.eta_max} min
                </Text>
              </View>
              <View style={styles.priceBreakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Base</Text>
                  <Text style={styles.breakdownValue}>{estimate.base_price.toLocaleString('fr-FR')} FCFA</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Distance ({estimate.distance_km.toFixed(1)} km)</Text>
                  <Text style={styles.breakdownValue}>
                    {(estimate.final_price - estimate.base_price).toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
                {estimate.surge_multiplier > 1 && (
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Surge ×{estimate.surge_multiplier}</Text>
                    <Text style={[styles.breakdownValue, { color: COLORS.warning }]}>Inclus</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Payment */}
        <Text style={styles.sectionLabel}>Mode de paiement</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.paymentChip, payment === m.id && styles.paymentChipSelected]}
              onPress={() => { void Haptics.selectionAsync(); setPayment(m.id); }}
            >
              <Text style={styles.paymentEmoji}>{m.emoji}</Text>
              <Text style={[styles.paymentLabel, payment === m.id && styles.paymentLabelSelected]}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {orderError && <Text style={styles.orderError}>{orderError}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={ordering ? 'Commande en cours…' : 'Commander'}
          onPress={onOrder}
          disabled={!estimate || estimating || ordering}
          loading={ordering}
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
  scrollContent: { paddingBottom: SPACING[8] },

  mapContainer: {
    height: 200,
    ...SHADOWS.md,
  },
  map: { flex: 1 },

  routeCard: {
    marginHorizontal: SPACING[5],
    marginTop: SPACING[4],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING[4],
    ...SHADOWS.sm,
  },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING[3] },
  routeDivider: {
    height: 20, width: 2, backgroundColor: COLORS.gray200,
    marginLeft: 14, marginVertical: 4,
  },
  pinA: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pinB: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center',
  },
  pinLabel: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  routeAddress: { ...TYPOGRAPHY.body, color: COLORS.dark, flex: 1 },

  detailsCard: {
    marginHorizontal: SPACING[5],
    marginTop: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
  },
  divider: { height: 1, backgroundColor: COLORS.gray100 },
  detailLabel: { ...TYPOGRAPHY.label, color: COLORS.gray400 },
  detailValue: { ...TYPOGRAPHY.body, color: COLORS.dark, fontWeight: '600', flex: 1, textAlign: 'right' },

  priceCard: {
    marginHorizontal: SPACING[5],
    marginTop: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING[5],
    ...SHADOWS.sm,
  },
  skeletonWrap: {
    alignItems: 'center',
    paddingVertical: SPACING[4],
    gap: SPACING[3],
  },
  estimatingText: { ...TYPOGRAPHY.body, color: COLORS.gray400 },
  errorText: { ...TYPOGRAPHY.body, color: COLORS.error },

  priceMain: { alignItems: 'center', marginBottom: SPACING[4] },
  priceBig: {
    fontSize: 36, fontWeight: '700', color: COLORS.dark,
    fontFamily: 'Poppins-Bold',
  },
  etaText: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.gray700,
    marginTop: SPACING[1],
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: SPACING[3],
    gap: SPACING[2],
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { ...TYPOGRAPHY.label, color: COLORS.gray400 },
  breakdownValue: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600' },

  sectionLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.gray700,
    fontWeight: '600',
    marginTop: SPACING[5],
    marginBottom: SPACING[3],
    paddingHorizontal: SPACING[5],
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING[5],
    gap: SPACING[3],
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  paymentChipSelected: { backgroundColor: '#FFF4EE', borderColor: COLORS.primary },
  paymentEmoji: { fontSize: 18 },
  paymentLabel: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600' },
  paymentLabelSelected: { color: COLORS.primary },

  orderError: {
    ...TYPOGRAPHY.label,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[5],
  },

  footer: {
    padding: SPACING[5],
    paddingBottom: SPACING[6],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
});
