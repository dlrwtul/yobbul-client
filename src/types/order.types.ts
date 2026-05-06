export type OrderStatus =
  | 'pending' | 'searching' | 'assigned' | 'collecting' | 'collected'
  | 'delivering' | 'delivered' | 'cancelled' | 'failed';

export type PackageType = 'standard' | 'fragile' | 'food' | 'document' | 'liquid';
export type VehicleType = 'moto' | 'bicycle' | 'car' | 'tricycle';
export type PaymentMethod = 'wave' | 'orange_money' | 'card' | 'cash' | 'credits';

export interface Location {
  address: string;
  lat: number;
  lng: number;
  instructions?: string;
}

export interface Order {
  id: string;
  clientId: string;
  driverId: string | null;
  status: OrderStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  packageType: PackageType;
  finalPrice: number;
  paymentMethod: PaymentMethod;
  etaMinutes: number | null;
  createdAt: string;
}

export interface PriceEstimate {
  base_price: number;
  surge_multiplier: number;
  final_price: number;
  eta_min: number;
  eta_max: number;
  distance_km: number;
  from_ai: boolean;
}
