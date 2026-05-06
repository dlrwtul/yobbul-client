import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Category } from '../utils/category';
import type { PackageType, VehicleType } from '../types/order.types';

export type AuthStackParamList = {
  Splash: undefined;
  PhoneInput: undefined;
  OTPVerify: { phone: string };
};

export interface PickupPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface OrderDraft {
  pickup: PickupPoint;
  dropoff: PickupPoint;
  packageType: PackageType;
  vehicleType: VehicleType;
  isFragile: boolean;
  requiresSignature: boolean;
  photoUri?: string;
}

export type HomeStackParamList = {
  Home: undefined;
  Pickup: { category?: Category } | undefined;
  Dropoff: { pickup: PickupPoint; category?: Category };
  Package: { pickup: PickupPoint; dropoff: PickupPoint };
  Confirm: OrderDraft;
  Tracking: { orderId: string };
  OrderDetail: { orderId: string };
};

export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  Historique: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
