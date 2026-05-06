import { ordersClient } from './client';

export interface Promo {
  id: string;
  code: string;
  title: string;
  description: string;
  discount_label: string;  // "-30%" ou "-500 FCFA"
  background_color: string;
  image_url: string | null;
  cta: string;
}

export const PromosApi = {
  async active(): Promise<Promo[]> {
    const res = await ordersClient.get<Promo[]>('/api/v1/promos/active');
    return res.data;
  },
};
