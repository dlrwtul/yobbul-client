import React from 'react';
import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import { StatusBadge } from '../ui/Badge';
import { formatPrice, relativeDate, truncate } from '../../utils/date';
import { PACKAGE_ICONS } from '../../utils/category';
import type { Order } from '../../types/order.types';

interface OrderCardProps {
  order: Order;
  onPress: (order: Order) => void;
  onReorder?: (order: Order) => void;
}

export function OrderCard({ order, onPress, onReorder }: OrderCardProps): React.ReactElement {
  const icon = PACKAGE_ICONS[order.packageType] ?? '📦';

  const handlePress = (_: GestureResponderEvent): void => {
    void Haptics.selectionAsync();
    onPress(order);
  };

  const handleReorder = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReorder?.(order);
  };

  const canReorder =
    order.status === 'delivered' || order.status === 'cancelled' || order.status === 'failed';

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.address} numberOfLines={1}>
            {truncate(order.dropoffAddress, 28)}
          </Text>
          <Text style={styles.price}>{formatPrice(order.finalPrice)}</Text>
        </View>

        <View style={styles.middleRow}>
          <StatusBadge status={order.status} />
          <Text style={styles.time}>{relativeDate(order.createdAt)}</Text>
        </View>

        {canReorder && onReorder && (
          <Pressable onPress={handleReorder} style={styles.reorderBtn} hitSlop={8}>
            <Text style={styles.reorderText}>↻ Recommander</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    marginBottom: SPACING[3],
    gap: SPACING[3],
    ...SHADOWS.sm,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  iconWrap: {
    width: 48, height: 48, borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 24 },

  body: { flex: 1, gap: 6 },
  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  address: { ...TYPOGRAPHY.bodyLarge, color: COLORS.dark, fontWeight: '600', flex: 1 },
  price: { ...TYPOGRAPHY.body, color: COLORS.primary, fontWeight: '700', marginLeft: SPACING[2] },

  middleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  time: { ...TYPOGRAPHY.label, color: COLORS.gray400 },

  reorderBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    marginTop: 4,
  },
  reorderText: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '600' },
});
