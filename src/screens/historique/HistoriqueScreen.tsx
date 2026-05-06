import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { OrdersApi } from '../../api/orders.api';
import { COLORS, TYPOGRAPHY } from '../../theme';
import type { Order, OrderStatus } from '../../types/order.types';
import type { AppTabParamList } from '../../navigation/types';

type Nav = BottomTabNavigationProp<AppTabParamList, 'Historique'>;

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'En attente',
  searching: 'Recherche',
  assigned: 'Assigné',
  collecting: 'Collecte',
  collected: 'Collecté',
  delivering: 'En livraison',
  delivered: 'Livré',
  cancelled: 'Annulé',
  failed: 'Échoué',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: COLORS.warning,
  searching: COLORS.warning,
  assigned: COLORS.navy,
  collecting: COLORS.navy,
  collected: COLORS.navy,
  delivering: COLORS.primary,
  delivered: COLORS.success,
  cancelled: COLORS.gray400,
  failed: COLORS.error,
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + '20' }]}>
      <View style={[styles.badgeDot, { backgroundColor: STATUS_COLOR[status] }]} />
      <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
        {STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OrderCard({ order }: { order: Order }) {
  const navigation = useNavigation<Nav>();

  const handlePress = useCallback(() => {
    if (['assigned', 'collecting', 'collected', 'delivering'].includes(order.status)) {
      navigation.navigate('HomeTab', {
        screen: 'Tracking',
        params: { orderId: order.id },
      });
    }
  }, [navigation, order.id, order.status]);

  const isActive = ['assigned', 'collecting', 'collected', 'delivering'].includes(order.status);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={isActive ? 0.7 : 1}
      disabled={!isActive}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{formatDate(order.createdAt)}</Text>
        <StatusBadge status={order.status} />
      </View>

      <View style={styles.routeRow}>
        <View style={styles.routePin}>
          <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
          <View style={styles.routeLine} />
          <View style={[styles.dot, { backgroundColor: COLORS.navy }]} />
        </View>
        <View style={styles.routeAddresses}>
          <Text style={styles.addressText} numberOfLines={1}>
            {order.pickupAddress}
          </Text>
          <View style={styles.addressSpacer} />
          <Text style={styles.addressText} numberOfLines={1}>
            {order.dropoffAddress}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.priceText}>{order.finalPrice.toLocaleString('fr-FR')} FCFA</Text>
        {isActive && (
          <Text style={styles.trackLink}>Suivre →</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📦</Text>
      <Text style={styles.emptyTitle}>Aucune livraison</Text>
      <Text style={styles.emptySubtitle}>
        Vos livraisons passées et en cours apparaîtront ici.
      </Text>
    </View>
  );
}

export function HistoriqueScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () => OrdersApi.list({ limit: 50 }),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Impossible de charger l'historique.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orders = data?.data ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Mes livraisons</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={orders.length === 0 ? styles.listEmpty : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray100,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDate: {
    ...TYPOGRAPHY.timestamp,
    color: COLORS.gray400,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  routePin: {
    alignItems: 'center',
    paddingTop: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 4,
  },
  routeAddresses: {
    flex: 1,
    justifyContent: 'space-between',
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
  },
  addressSpacer: {
    height: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 10,
  },
  priceText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.dark,
  },
  trackLink: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray400,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});
