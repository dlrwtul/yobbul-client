import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../theme';

interface HomeMapProps {
  location: { lat: number; lng: number } | null;
  permissionGranted: boolean;
  driverCount: number | null;
  isLoadingDrivers: boolean;
  onRequestPermission: () => void;
}

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_H * 0.4);

export function HomeMap(props: HomeMapProps): React.ReactElement {
  const { location, permissionGranted, driverCount, isLoadingDrivers, onRequestPermission } = props;

  // ── Placeholder when permission is denied or location unavailable
  if (!permissionGranted || !location) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>📍</Text>
        <Text style={styles.placeholderTitle}>
          {permissionGranted ? 'Recherche de votre position…' : 'Localisation désactivée'}
        </Text>
        <Text style={styles.placeholderDesc}>
          Activez votre position pour voir les livreurs disponibles près de vous.
        </Text>
        {!permissionGranted && (
          <Pressable style={styles.enableBtn} onPress={onRequestPermission}>
            <Text style={styles.enableBtnText}>Activer la localisation</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={{
          latitude: location.lat,
          longitude: location.lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        <Marker
          coordinate={{ latitude: location.lat, longitude: location.lng }}
          title="Votre position"
        />
      </MapView>

      <View style={styles.driversBadge}>
        <Text style={styles.driversDot}>●</Text>
        <Text style={styles.driversText}>
          {isLoadingDrivers
            ? 'Recherche…'
            : driverCount === null
              ? 'Livreurs indisponibles'
              : driverCount === 0
                ? 'Aucun livreur près de vous'
                : `${driverCount} livreur${driverCount > 1 ? 's' : ''} disponible${driverCount > 1 ? 's' : ''} près de vous`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: MAP_HEIGHT,
    marginHorizontal: SPACING[5],
    marginTop: SPACING[2],
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  map: { flex: 1 },

  placeholder: {
    height: MAP_HEIGHT,
    marginHorizontal: SPACING[5],
    marginTop: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING[6],
  },
  placeholderIcon: { fontSize: 48 },
  placeholderTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.dark,
    marginTop: SPACING[3],
    textAlign: 'center',
  },
  placeholderDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray700,
    textAlign: 'center',
    marginTop: SPACING[2],
  },
  enableBtn: {
    marginTop: SPACING[4],
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[6],
    borderRadius: RADIUS.full,
  },
  enableBtnText: {
    ...TYPOGRAPHY.label,
    color: COLORS.white,
    fontWeight: '700',
  },

  driversBadge: {
    position: 'absolute',
    bottom: SPACING[4],
    left: SPACING[4],
    right: SPACING[4],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    ...SHADOWS.sm,
  },
  driversDot: { color: COLORS.success, fontSize: 12 },
  driversText: { ...TYPOGRAPHY.label, color: COLORS.dark, fontWeight: '600', flex: 1 },
});
