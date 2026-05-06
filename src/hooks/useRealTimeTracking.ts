import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { readAccessToken } from '../store/auth.store';
import type { Order, OrderStatus } from '../types/order.types';

type AppConfig = { trackingUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as AppConfig;
const TRACKING_URL =
  process.env.EXPO_PUBLIC_TRACKING_URL ?? extra.trackingUrl ?? 'http://localhost:3003';

export interface DriverLocation {
  lat: number;
  lng: number;
  heading: number | null;
}

export interface DriverInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  vehicleType: string;
  plate: string;
  phone: string;
}

export interface TrackingState {
  order: Order | null;
  status: OrderStatus | null;
  driverLocation: DriverLocation | null;
  driverInfo: DriverInfo | null;
  etaMinutes: number | null;
  connected: boolean;
  error: string | null;
}

const BASE_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const MAX_RETRIES = 10;

export function useRealTimeTracking(orderId: string): TrackingState {
  const [state, setState] = useState<TrackingState>({
    order: null,
    status: null,
    driverLocation: null,
    driverInfo: null,
    etaMinutes: null,
    connected: false,
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(async () => {
    if (unmountedRef.current) return;

    const token = await readAccessToken();

    const socket = io(TRACKING_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: false, // managed manually for exponential backoff
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (unmountedRef.current) return;
      retryCountRef.current = 0;
      setState((s) => ({ ...s, connected: true, error: null }));
      socket.emit('join_order', { order_id: orderId });
    });

    socket.on('order_state', (data: { order: Order; driver?: DriverInfo }) => {
      if (unmountedRef.current) return;
      setState((s) => ({
        ...s,
        order: data.order,
        status: data.order.status,
        etaMinutes: data.order.etaMinutes,
        driverInfo: data.driver ?? s.driverInfo,
      }));
    });

    socket.on('driver_location', (data: { lat: number; lng: number; heading: number | null }) => {
      if (unmountedRef.current) return;
      setState((s) => ({ ...s, driverLocation: data }));
    });

    socket.on('order_status_updated', (data: { status: OrderStatus; eta_minutes?: number }) => {
      if (unmountedRef.current) return;
      setState((s) => ({
        ...s,
        status: data.status,
        etaMinutes: data.eta_minutes ?? s.etaMinutes,
      }));
    });

    socket.on('driver_assigned', (data: DriverInfo) => {
      if (unmountedRef.current) return;
      setState((s) => ({ ...s, driverInfo: data }));
    });

    socket.on('disconnect', () => {
      if (unmountedRef.current) return;
      setState((s) => ({ ...s, connected: false }));
      scheduleReconnect();
    });

    socket.on('connect_error', () => {
      if (unmountedRef.current) return;
      setState((s) => ({ ...s, connected: false }));
      scheduleReconnect();
    });
  }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleReconnect(): void {
    if (unmountedRef.current) return;
    if (retryCountRef.current >= MAX_RETRIES) {
      setState((s) => ({
        ...s,
        error: 'Connexion perdue. Vérifiez votre réseau.',
      }));
      return;
    }
    const backoff = Math.min(
      BASE_BACKOFF_MS * 2 ** retryCountRef.current,
      MAX_BACKOFF_MS,
    );
    retryCountRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (unmountedRef.current) return;
      socketRef.current?.disconnect();
      void connect();
    }, backoff);
  }

  useEffect(() => {
    unmountedRef.current = false;
    void connect();

    return () => {
      unmountedRef.current = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      socketRef.current?.disconnect();
    };
  }, [connect]);

  return state;
}
