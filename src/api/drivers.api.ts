import { apiClient } from './client';

export interface NearbyDriversResponse {
  count: number;
  radius_km: number;
}

export const DriversApi = {
  // Endpoint à ajouter côté backend — fallback à 0 si indispo
  async nearby(lat: number, lng: number, radiusKm = 3): Promise<NearbyDriversResponse> {
    const res = await apiClient.get<NearbyDriversResponse>('/api/v1/drivers/nearby', {
      params: { lat, lng, radius: radiusKm },
    });
    return res.data;
  },
};
