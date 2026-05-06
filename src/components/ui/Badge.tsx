import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../theme';
import type { OrderStatus } from '../../types/order.types';

interface StatusBadgeProps {
  status: OrderStatus;
  style?: ViewStyle;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'En attente',
  searching:  'Recherche livreur',
  assigned:   'Livreur assigné',
  collecting: 'Vers collecte',
  collected:  'Collecté',
  delivering: 'En route',
  delivered:  'Livré',
  cancelled:  'Annulé',
  failed:     'Échoué',
};

const STATUS_PALETTE: Record<OrderStatus, { bg: string; fg: string }> = {
  pending:    { bg: '#DBEAFE', fg: '#1E40AF' },
  searching:  { bg: '#DBEAFE', fg: '#1E40AF' },
  assigned:   { bg: '#FEF3C7', fg: '#92400E' },
  collecting: { bg: '#FED7AA', fg: '#9A3412' },
  collected:  { bg: '#FED7AA', fg: '#9A3412' },
  delivering: { bg: '#FED7AA', fg: '#9A3412' },
  delivered:  { bg: '#D1FAE5', fg: '#065F46' },
  cancelled:  { bg: '#FEE2E2', fg: '#991B1B' },
  failed:     { bg: COLORS.gray200, fg: COLORS.gray700 },
};

export function StatusBadge({ status, style }: StatusBadgeProps): React.ReactElement {
  const p = STATUS_PALETTE[status];
  return (
    <View style={[styles.badge, { backgroundColor: p.bg }, style]}>
      <Text style={[styles.text, { color: p.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  text: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '600',
  },
});
