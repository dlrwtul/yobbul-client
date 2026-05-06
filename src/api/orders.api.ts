import { ordersClient } from './client';
import type { Order, PackageType, PriceEstimate, VehicleType } from '../types/order.types';

export interface PaginatedOrders {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListOrdersQuery {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface EstimateOrderDto {
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  package_type: PackageType;
  vehicle_type: VehicleType;
}

export interface CreateOrderDto extends EstimateOrderDto {
  pickup_address: string;
  dropoff_address: string;
  is_fragile: boolean;
  requires_signature: boolean;
  payment_method: string;
  photo_url?: string;
}

export const OrdersApi = {
  async list(query: ListOrdersQuery = {}): Promise<PaginatedOrders> {
    const res = await ordersClient.get<PaginatedOrders>('/api/v1/orders', { params: query });
    return res.data;
  },

  async findOne(id: string): Promise<Order> {
    const res = await ordersClient.get<Order>(`/api/v1/orders/${id}`);
    return res.data;
  },

  async estimate(dto: EstimateOrderDto): Promise<PriceEstimate> {
    const res = await ordersClient.post<PriceEstimate>('/api/v1/orders/estimate', dto);
    return res.data;
  },

  async create(dto: CreateOrderDto): Promise<Order> {
    const res = await ordersClient.post<Order>('/api/v1/orders', dto);
    return res.data;
  },
};
