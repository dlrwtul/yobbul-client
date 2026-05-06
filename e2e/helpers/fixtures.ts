export const PHONE    = '+221771234567'
export const VALID_OTP = '123456'
export const BAD_OTP   = '000000'

export const AUTH_TOKENS = {
  access_token:  'eyJhbGciOiJSUzI1NiJ9.test',
  refresh_token: 'refresh-token-test',
  expires_in:    3600,
}

export const USER = {
  id:        'usr-001',
  phone:     PHONE,
  firstName: 'Fatou',
  lastName:  'Sow',
  email:     null,
  avatar:    null,
  credits:   500,
}

export const ESTIMATE = {
  base_price:        800,
  surge_multiplier:  1.0,
  final_price:       1200,
  eta_min:           8,
  eta_max:           14,
  distance_km:       3.2,
  from_ai:           true,
}

export const ORDER = {
  id:             'ord-abc-001',
  clientId:       USER.id,
  driverId:       null,
  status:         'pending' as const,
  pickupAddress:  '5 Rue de Thiong, Dakar',
  pickupLat:      14.6937,
  pickupLng:      -17.4441,
  dropoffAddress: '12 Av Cheikh Anta Diop',
  dropoffLat:     14.6928,
  dropoffLng:     -17.4673,
  packageType:    'standard' as const,
  finalPrice:     1200,
  paymentMethod:  'wave' as const,
  etaMinutes:     11,
  createdAt:      '2024-01-15T10:00:00Z',
}

export const ORDER_ASSIGNED = {
  ...ORDER,
  status:   'assigned' as const,
  driverId: 'drv-001',
  driverName: 'Ibrahima Ba',
  driverPhone: '+221779876543',
  driverRating: 4.8,
}

export const ORDER_DELIVERED = {
  ...ORDER,
  status:   'delivered' as const,
  driverId: 'drv-001',
}

export const PAGINATED_ORDERS = {
  data:       [ORDER_DELIVERED],
  total:      1,
  page:       1,
  limit:      10,
  totalPages: 1,
}

// ── Stub sets for common flows ────────────────────────────────────────────────

export function stubAuthFlow(server: { stub: (m: string, p: string, s: number, b: unknown) => unknown }) {
  server.stub('POST', '/api/v1/auth/request-otp', 200, { message: 'OTP envoyé' })
  server.stub('POST', '/api/v1/auth/verify-otp',  200, { ...AUTH_TOKENS, user: USER })
  server.stub('GET',  '/api/v1/auth/me',           200, USER)
}

export function stubOrderFlow(server: { stub: (m: string, p: string, s: number, b: unknown) => unknown }) {
  server.stub('POST', '/api/v1/orders/estimate', 200, ESTIMATE)
  server.stub('POST', '/api/v1/orders',          201, ORDER)
  server.stub('GET',  '/api/v1/orders',          200, PAGINATED_ORDERS)
  server.stub('GET',  `/api/v1/orders/${ORDER.id}`, 200, ORDER_ASSIGNED)
  server.stub('PATCH', `/api/v1/orders/${ORDER.id}/cancel`, 200, { ...ORDER, status: 'cancelled' })
}
