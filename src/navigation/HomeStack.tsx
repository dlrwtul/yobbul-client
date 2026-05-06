import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PickupScreen } from '../screens/order/PickupScreen';
import { DropoffScreen } from '../screens/order/DropoffScreen';
import { PackageScreen } from '../screens/order/PackageScreen';
import { ConfirmScreen } from '../screens/order/ConfirmScreen';
import { TrackingScreen } from '../screens/order/TrackingScreen';
import { COLORS, TYPOGRAPHY } from '../theme';
import type { HomeStackParamList } from './types';

const Stack = createStackNavigator<HomeStackParamList>();

function PlaceholderScreen({ route }: { route: { name: string } }): React.ReactElement {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>{route.name}</Text>
      <Text style={styles.placeholderHint}>Écran à venir</Text>
    </View>
  );
}

export function HomeStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Pickup" component={PickupScreen} />
      <Stack.Screen name="Dropoff" component={DropoffScreen} />
      <Stack.Screen name="Package" component={PackageScreen} />
      <Stack.Screen name="Confirm" component={ConfirmScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
      <Stack.Screen name="OrderDetail" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white,
  },
  placeholderText: { ...TYPOGRAPHY.h1, color: COLORS.dark },
  placeholderHint: { ...TYPOGRAPHY.body, color: COLORS.gray400, marginTop: 8 },
});
