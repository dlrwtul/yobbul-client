import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface LocationState {
  location: { lat: number; lng: number } | null;
  permission: PermissionStatus;
  isLoading: boolean;
  error: string | null;
  request: () => Promise<void>;
}

export function useLocation(): LocationState {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosition = useCallback(async (): Promise<void> => {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      setLocation(null);
    }
  }, []);

  const request = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (res.status === 'granted') {
        setPermission('granted');
        await fetchPosition();
      } else {
        setPermission('denied');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosition]);

  useEffect(() => {
    (async () => {
      const existing = await Location.getForegroundPermissionsAsync();
      if (existing.status === 'granted') {
        setPermission('granted');
        await fetchPosition();
      } else {
        setPermission(existing.status === 'denied' ? 'denied' : 'undetermined');
      }
      setIsLoading(false);
    })();
  }, [fetchPosition]);

  return { location, permission, isLoading, error, request };
}
