import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, Modal, TextInput,
  ScrollView, FlatList, Linking, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, {
  Marker, Polyline, AnimatedRegion, MarkerAnimated, PROVIDER_DEFAULT,
} from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';

import { useRealTimeTracking } from '../../hooks/useRealTimeTracking';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';
import type { HomeStackParamList } from '../../navigation/types';
import type { OrderStatus } from '../../types/order.types';

type Nav = StackNavigationProp<HomeStackParamList, 'Tracking'>;
type RouteProps = RouteProp<HomeStackParamList, 'Tracking'>;

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_H * 0.6);

// ── Status steps ─────────────────────────────────────────────────────────────

interface Step {
  statuses: OrderStatus[];
  label: string;
}
const STEPS: Step[] = [
  { statuses: ['pending', 'searching', 'assigned'], label: 'Confirmé' },
  { statuses: ['collecting', 'collected'], label: 'Collecté' },
  { statuses: ['delivering'], label: 'En route' },
  { statuses: ['delivered'], label: 'Livré' },
];

function stepIndex(status: OrderStatus | null): number {
  if (!status) return 0;
  return STEPS.findIndex((s) => s.statuses.includes(status));
}

function StatusStepBar({ status }: { status: OrderStatus | null }): React.ReactElement {
  const active = stepIndex(status);
  return (
    <View style={stepStyles.bar}>
      {STEPS.map((step, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <View key={step.label} style={stepStyles.stepWrap}>
            <View style={[
              stepStyles.dot,
              done && stepStyles.dotDone,
              current && stepStyles.dotActive,
            ]}>
              {done ? (
                <Text style={stepStyles.checkmark}>✓</Text>
              ) : (
                <Text style={[stepStyles.dotNum, current && stepStyles.dotNumActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[
              stepStyles.stepLabel,
              done && stepStyles.labelDone,
              current && stepStyles.labelActive,
            ]}>
              {step.label}
            </Text>
            {i < STEPS.length - 1 && (
              <View style={[stepStyles.connector, done && stepStyles.connectorDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[5],
    paddingVertical: SPACING[4],
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  stepWrap: { alignItems: 'center', flex: 1, position: 'relative' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.gray100,
    borderWidth: 2, borderColor: COLORS.gray200,
    alignItems: 'center', justifyContent: 'center',
  },
  dotDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  dotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  dotNum: { ...TYPOGRAPHY.label, color: COLORS.gray400, fontWeight: '600' },
  dotNumActive: { color: COLORS.white },
  stepLabel: { ...TYPOGRAPHY.label, fontSize: 10, color: COLORS.gray400, marginTop: 4, textAlign: 'center' },
  labelDone: { color: COLORS.success },
  labelActive: { color: COLORS.primary, fontWeight: '700' },
  connector: {
    position: 'absolute',
    top: 13,
    right: '-50%',
    width: '100%',
    height: 2,
    backgroundColor: COLORS.gray200,
    zIndex: -1,
  },
  connectorDone: { backgroundColor: COLORS.success },
});

// ── Chat modal ────────────────────────────────────────────────────────────────

const QUICK_MESSAGES = [
  'Je suis en route !',
  'Sonnez à l\'interphone',
  'Laissez devant la porte',
  'Où êtes-vous exactement ?',
];

interface ChatMessage {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

function ChatModal({
  visible,
  onClose,
  orderId,
}: { visible: boolean; onClose: () => void; orderId: string }): React.ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');

  function sendMessage(msg: string): void {
    if (!msg.trim()) return;
    void Haptics.selectionAsync();
    const now = new Date();
    setMessages((prev) => [...prev, {
      id: `${Date.now()}`,
      text: msg.trim(),
      fromMe: true,
      time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`,
    }]);
    setText('');
    // TODO: emit via socket to chat service
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={chatStyles.safeArea} edges={['top', 'bottom']}>
        <View style={chatStyles.header}>
          <Text style={chatStyles.title}>Message au livreur</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={chatStyles.close}>Fermer</Text>
          </Pressable>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={chatStyles.messageList}
          renderItem={({ item }) => (
            <View style={[chatStyles.bubble, item.fromMe && chatStyles.bubbleMe]}>
              <Text style={[chatStyles.bubbleText, item.fromMe && chatStyles.bubbleTextMe]}>
                {item.text}
              </Text>
              <Text style={chatStyles.bubbleTime}>{item.time}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={chatStyles.emptyHint}>
              Utilisez les réponses rapides ci-dessous ou tapez votre message.
            </Text>
          }
        />

        <View style={chatStyles.quickWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chatStyles.quickRow}>
            {QUICK_MESSAGES.map((q) => (
              <Pressable key={q} style={chatStyles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={chatStyles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={chatStyles.inputRow}>
          <TextInput
            style={chatStyles.input}
            value={text}
            onChangeText={setText}
            placeholder="Votre message…"
            placeholderTextColor={COLORS.gray400}
            maxLength={200}
            multiline
          />
          <Pressable
            style={[chatStyles.sendBtn, !text.trim() && chatStyles.sendBtnDisabled]}
            onPress={() => sendMessage(text)}
            disabled={!text.trim()}
          >
            <Text style={chatStyles.sendIcon}>➤</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const chatStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[5],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: { ...TYPOGRAPHY.h2, color: COLORS.dark },
  close: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '600' },

  messageList: { padding: SPACING[5], gap: SPACING[3] },
  emptyHint: { ...TYPOGRAPHY.body, color: COLORS.gray400, textAlign: 'center', paddingTop: SPACING[6] },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  bubbleText: { ...TYPOGRAPHY.body, color: COLORS.dark },
  bubbleTextMe: { color: COLORS.white },
  bubbleTime: { ...TYPOGRAPHY.timestamp, color: COLORS.gray400, marginTop: 2 },

  quickWrap: { borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  quickRow: { padding: SPACING[3], gap: SPACING[2] },
  quickChip: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  quickText: { ...TYPOGRAPHY.label, color: COLORS.dark },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING[4],
    gap: SPACING[3],
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.dark,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
    padding: SPACING[3],
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.gray200 },
  sendIcon: { color: COLORS.white, fontSize: 16 },
});

// ── TrackingScreen ────────────────────────────────────────────────────────────

export function TrackingScreen({
  navigation, route,
}: { navigation: Nav; route: RouteProps }): React.ReactElement {
  const { orderId } = route.params;
  const tracking = useRealTimeTracking(orderId);
  const mapRef = useRef<MapView>(null);
  const [showChat, setShowChat] = useState(false);

  // Animated marker for smooth driver movement
  const driverCoord = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;

  useEffect(() => {
    if (!tracking.driverLocation) return;
    const { lat, lng } = tracking.driverLocation;
    driverCoord
      .timing({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0,
        longitudeDelta: 0,
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      })
      .start();
    // Smoothly recentre map on driver
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 800);
  }, [tracking.driverLocation, driverCoord]);

  const order = tracking.order;
  const canCancel = order && !['collecting', 'collected', 'delivering', 'delivered', 'cancelled', 'failed'].includes(order.status);

  function callDriver(): void {
    if (!tracking.driverInfo?.phone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(`tel:${tracking.driverInfo.phone}`);
  }

  function shareTracking(): void {
    void Haptics.selectionAsync();
    // TODO: generate deep link
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} translucent={false} />

      {/* Status steps */}
      <SafeAreaView edges={['top']}>
        <StatusStepBar status={tracking.status} />
        {!tracking.connected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              {tracking.error ?? 'Reconnexion…'}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ height: MAP_HEIGHT }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        initialRegion={order ? {
          latitude: order.pickupLat,
          longitude: order.pickupLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      >
        {order && (
          <>
            <Marker
              coordinate={{ latitude: order.pickupLat, longitude: order.pickupLng }}
              pinColor={COLORS.primary}
              title="Collecte"
            />
            <Marker
              coordinate={{ latitude: order.dropoffLat, longitude: order.dropoffLng }}
              pinColor={COLORS.navy}
              title="Livraison"
            />
            <Polyline
              coordinates={[
                { latitude: order.pickupLat, longitude: order.pickupLng },
                { latitude: order.dropoffLat, longitude: order.dropoffLng },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          </>
        )}

        {tracking.driverLocation && (
          <MarkerAnimated
            coordinate={driverCoord}
            title={tracking.driverInfo?.name ?? 'Livreur'}
            rotation={tracking.driverLocation.heading ?? 0}
          >
            <View style={styles.driverMarker}>
              <Text style={styles.driverMarkerEmoji}>🛵</Text>
            </View>
          </MarkerAnimated>
        )}
      </MapView>

      {/* Driver card */}
      <SafeAreaView edges={['bottom']} style={styles.cardSafe}>
        <View style={styles.card}>
          {tracking.driverInfo ? (
            <>
              <View style={styles.driverRow}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarInitial}>
                    {tracking.driverInfo.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{tracking.driverInfo.name}</Text>
                  <Text style={styles.driverMeta}>
                    ⭐ {tracking.driverInfo.rating.toFixed(1)} · {tracking.driverInfo.vehicleType} · {tracking.driverInfo.plate}
                  </Text>
                </View>
                <View style={styles.etaBadge}>
                  <Text style={styles.etaLabel}>ETA</Text>
                  <Text style={styles.etaValue}>
                    ~{tracking.etaMinutes ?? '–'} min
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={callDriver}>
                  <Text style={styles.actionEmoji}>📞</Text>
                  <Text style={styles.actionLabel}>Appeler</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => setShowChat(true)}>
                  <Text style={styles.actionEmoji}>💬</Text>
                  <Text style={styles.actionLabel}>Message</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={shareTracking}>
                  <Text style={styles.actionEmoji}>🔗</Text>
                  <Text style={styles.actionLabel}>Partager</Text>
                </Pressable>
              </View>

              {canCancel && (
                <Pressable style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Annuler la commande</Text>
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.searchingWrap}>
              <Text style={styles.searchingIcon}>🔍</Text>
              <Text style={styles.searchingText}>
                {tracking.status === 'searching'
                  ? 'Recherche d\'un livreur disponible…'
                  : 'En attente de confirmation…'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>

      <ChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        orderId={orderId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },

  offlineBanner: {
    backgroundColor: COLORS.warning,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[5],
    alignItems: 'center',
  },
  offlineText: { ...TYPOGRAPHY.label, color: COLORS.white, fontWeight: '600' },

  driverMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.md,
  },
  driverMarkerEmoji: { fontSize: 22 },

  cardSafe: { backgroundColor: COLORS.white },
  card: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING[5],
    ...SHADOWS.lg,
    minHeight: 160,
  },

  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
    marginBottom: SPACING[4],
  },
  avatarWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { ...TYPOGRAPHY.h2, color: COLORS.white },
  driverInfo: { flex: 1 },
  driverName: { ...TYPOGRAPHY.bodyLarge, color: COLORS.dark, fontWeight: '700' },
  driverMeta: { ...TYPOGRAPHY.label, color: COLORS.gray400, marginTop: 2 },

  etaBadge: {
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    alignItems: 'center',
    minWidth: 64,
  },
  etaLabel: { ...TYPOGRAPHY.label, fontSize: 10, color: COLORS.gray400 },
  etaValue: { ...TYPOGRAPHY.bodyLarge, color: COLORS.dark, fontWeight: '700' },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING[4],
  },
  actionBtn: {
    alignItems: 'center',
    gap: SPACING[1],
    flex: 1,
  },
  actionEmoji: { fontSize: 26 },
  actionLabel: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600' },

  cancelBtn: {
    alignItems: 'center',
    paddingVertical: SPACING[3],
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelText: { ...TYPOGRAPHY.label, color: COLORS.error, fontWeight: '600' },

  searchingWrap: {
    alignItems: 'center',
    paddingVertical: SPACING[4],
    gap: SPACING[3],
  },
  searchingIcon: { fontSize: 36 },
  searchingText: { ...TYPOGRAPHY.body, color: COLORS.gray700 },
});
