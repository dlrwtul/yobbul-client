import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { StackNavigationProp } from '@react-navigation/stack';

import { HomeHeader } from '../../components/home/HomeHeader';
import { HomeMap } from '../../components/home/HomeMap';
import { SearchBar } from '../../components/home/SearchBar';
import { CategoryChips } from '../../components/home/CategoryChips';
import { PromoBanner } from '../../components/home/PromoBanner';
import { LocationPermissionModal } from '../../components/home/LocationPermissionModal';
import { OrderCard } from '../../components/order/OrderCard';
import { useAuthStore } from '../../store/auth.store';
import { useLocation } from '../../hooks/useLocation';
import { OrdersApi } from '../../api/orders.api';
import { DriversApi } from '../../api/drivers.api';
import { PromosApi } from '../../api/promos.api';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import type { HomeStackParamList } from '../../navigation/types';
import type { Category } from '../../utils/category';
import type { Order } from '../../types/order.types';

type Nav = StackNavigationProp<HomeStackParamList, 'Home'>;

export function HomeScreen({ navigation }: { navigation: Nav }): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const loc = useLocation();

  // Show the custom permission rationale modal only on first undetermined state
  const [showPermModal, setShowPermModal] = useState(false);
  const permChecked = useRef(false);

  useEffect(() => {
    if (!permChecked.current && loc.permission === 'undetermined' && !loc.isLoading) {
      permChecked.current = true;
      setShowPermModal(true);
    }
    if (loc.permission !== 'undetermined') {
      setShowPermModal(false);
    }
  }, [loc.permission, loc.isLoading]);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const { data: ordersData, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => OrdersApi.list({ limit: 3, page: 1 }),
    staleTime: 60_000,
  });

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers', 'nearby', loc.location?.lat, loc.location?.lng],
    queryFn: () => DriversApi.nearby(loc.location!.lat, loc.location!.lng),
    enabled: loc.permission === 'granted' && !!loc.location,
    staleTime: 30_000,
  });

  const { data: promosData, refetch: refetchPromos } = useQuery({
    queryKey: ['promos', 'active'],
    queryFn: PromosApi.active,
    staleTime: 300_000,
  });

  const [refreshing, setRefreshing] = useState(false);
  async function onRefresh(): Promise<void> {
    setRefreshing(true);
    await Promise.all([refetchOrders(), refetchPromos()]);
    setRefreshing(false);
  }

  // ── Event handlers ───────────────────────────────────────────────────────────

  function onCategorySelect(cat: Category): void {
    navigation.navigate('Pickup', { category: cat });
  }

  function onOrderPress(order: Order): void {
    navigation.navigate('OrderDetail', { orderId: order.id });
  }

  function onReorder(order: Order): void {
    // Navigate to Pickup pre-filled with the previous order's pickup address
    navigation.navigate('Pickup');
  }

  async function onAllowLocation(): Promise<void> {
    setShowPermModal(false);
    await loc.request();
  }

  function onDenyLocation(): void {
    setShowPermModal(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const recentOrders = ordersData?.data ?? [];
  const firstPromo = promosData?.[0] ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <HomeHeader
          firstName={user?.first_name ?? ''}
          avatarUrl={user?.avatar_url}
        />

        <HomeMap
          location={loc.location}
          permissionGranted={loc.permission === 'granted'}
          driverCount={driversData?.count ?? null}
          isLoadingDrivers={driversLoading && loc.permission === 'granted'}
          onRequestPermission={() => setShowPermModal(true)}
        />

        <SearchBar onPress={() => navigation.navigate('Pickup')} />

        <CategoryChips onSelect={onCategorySelect} />

        {firstPromo && (
          <PromoBanner promo={firstPromo} onPress={() => {}} />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>

          {ordersLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chargement…</Text>
            </View>
          ) : recentOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>Aucune commande pour l'instant</Text>
              <Text style={styles.emptyHint}>
                Votre historique apparaîtra ici après votre première livraison.
              </Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={onOrderPress}
                onReorder={onReorder}
              />
            ))
          )}
        </View>
      </ScrollView>

      <LocationPermissionModal
        visible={showPermModal}
        onAllow={onAllowLocation}
        onDeny={onDenyLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING[8] },

  section: {
    marginTop: SPACING[4],
    paddingHorizontal: SPACING[5],
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark,
    marginBottom: SPACING[3],
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING[8],
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: {
    ...TYPOGRAPHY.bodyLarge,
    color: COLORS.dark,
    fontWeight: '600',
    marginTop: SPACING[3],
  },
  emptyHint: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
  },
});
