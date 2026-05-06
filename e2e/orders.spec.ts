/**
 * US-C04  Estimation tarif → saisie adresses → confirmation → création commande
 * US-C05  Suivi commande en temps réel (statuts livreur, ETA)
 * US-C06  Annulation d'une commande en attente (statut pending)
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { mockServer } from './helpers/mockServer'
import {
  PHONE, VALID_OTP, AUTH_TOKENS, USER,
  ESTIMATE, ORDER, ORDER_ASSIGNED, stubAuthFlow, stubOrderFlow,
} from './helpers/fixtures'

// Helper: authenticate then land on HomeScreen
async function loginAndGoHome() {
  stubAuthFlow(mockServer)
  await device.reloadReactNative()

  await element(by.id('phone-input')).typeText(PHONE)
  await element(by.id('phone-submit-btn')).tap()
  await waitFor(element(by.id('otp-verify-screen'))).toBeVisible().withTimeout(5000)
  await element(by.id('otp-input')).typeText(VALID_OTP)
  await element(by.id('otp-submit-btn')).tap()
  await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(8000)
}

// ── US-C04 ────────────────────────────────────────────────────────────────────

describe('US-C04 — Estimation et création de commande', () => {
  beforeEach(async () => {
    stubOrderFlow(mockServer)
    await loginAndGoHome()
  })

  it('bouton "Commander" visible sur HomeScreen', async () => {
    await detoxExpect(element(by.id('new-order-btn'))).toBeVisible()
  })

  it('saisie de l\'adresse de ramassage → POST /orders/estimate', async () => {
    await element(by.id('new-order-btn')).tap()

    // PickupScreen
    await waitFor(element(by.id('pickup-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('pickup-address-input')).typeText('5 Rue de Thiong, Dakar')
    await element(by.id('pickup-confirm-btn')).tap()

    // DropoffScreen
    await waitFor(element(by.id('dropoff-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('dropoff-address-input')).typeText('12 Av Cheikh Anta Diop')
    await element(by.id('dropoff-confirm-btn')).tap()

    // PackageScreen (type + vehicle type)
    await waitFor(element(by.id('package-screen'))).toBeVisible().withTimeout(5000)

    // POST /estimate is called
    await waitFor(() => expect(mockServer.calledOnce('POST', '/api/v1/orders/estimate')).toBe(true))
      .withTimeout(5000)
  })

  it('ConfirmScreen affiche le tarif estimé de l\'API', async () => {
    await element(by.id('new-order-btn')).tap()
    await waitFor(element(by.id('pickup-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('pickup-address-input')).typeText('5 Rue de Thiong, Dakar')
    await element(by.id('pickup-confirm-btn')).tap()
    await waitFor(element(by.id('dropoff-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('dropoff-address-input')).typeText('12 Av Cheikh Anta Diop')
    await element(by.id('dropoff-confirm-btn')).tap()
    await waitFor(element(by.id('confirm-screen'))).toBeVisible().withTimeout(8000)

    // 1 200 FCFA from ESTIMATE fixture
    await detoxExpect(element(by.text(/1.*200.*FCFA/))).toBeVisible()
    // ETA range
    await detoxExpect(element(by.text(/8.*14\s*min/i))).toBeVisible()
  })

  it('confirmation → POST /orders → redirection TrackingScreen', async () => {
    await element(by.id('new-order-btn')).tap()
    await waitFor(element(by.id('pickup-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('pickup-address-input')).typeText('5 Rue de Thiong, Dakar')
    await element(by.id('pickup-confirm-btn')).tap()
    await waitFor(element(by.id('dropoff-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('dropoff-address-input')).typeText('12 Av Cheikh Anta Diop')
    await element(by.id('dropoff-confirm-btn')).tap()
    await waitFor(element(by.id('confirm-screen'))).toBeVisible().withTimeout(8000)

    // Confirm order
    await element(by.id('confirm-order-btn')).tap()

    expect(mockServer.calledOnce('POST', '/api/v1/orders')).toBe(true)
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)
  })

  it('sélection méthode de paiement Wave visible sur ConfirmScreen', async () => {
    await element(by.id('new-order-btn')).tap()
    await waitFor(element(by.id('pickup-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('pickup-address-input')).typeText('5 Rue de Thiong')
    await element(by.id('pickup-confirm-btn')).tap()
    await waitFor(element(by.id('dropoff-screen'))).toBeVisible().withTimeout(5000)
    await element(by.id('dropoff-address-input')).typeText('12 Av Cheikh Anta Diop')
    await element(by.id('dropoff-confirm-btn')).tap()
    await waitFor(element(by.id('confirm-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.id('payment-wave'))).toBeVisible()
  })
})

// ── US-C05 ────────────────────────────────────────────────────────────────────

describe('US-C05 — Suivi de commande en temps réel', () => {
  beforeEach(async () => {
    stubOrderFlow(mockServer)
    // Tracking endpoint returns assigned order with driver info
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, ORDER_ASSIGNED)
    await loginAndGoHome()
  })

  it('TrackingScreen affiche le statut "Livreur assigné"', async () => {
    // Navigate directly to tracking screen for existing order
    // In a real flow this comes from creating an order; here we trigger via deep link
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.text(/assigné|en route/i))).toBeVisible()
  })

  it('affiche le nom et la note du livreur', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.text('Ibrahima Ba'))).toBeVisible()
    await detoxExpect(element(by.text(/4[.,]8/))).toBeVisible()
  })

  it('affiche l\'ETA en minutes', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.text(/11\s*min/i))).toBeVisible()
  })

  it('la carte (MapView) est rendue', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.id('tracking-map'))).toBeVisible()
  })
})

// ── US-C06 ────────────────────────────────────────────────────────────────────

describe('US-C06 — Annulation d\'une commande', () => {
  beforeEach(async () => {
    stubOrderFlow(mockServer)
    // Override order to be in cancellable state
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, ORDER)
    mockServer.stub('PATCH', `/api/v1/orders/${ORDER.id}/cancel`, 200, {
      ...ORDER, status: 'cancelled',
    })
    await loginAndGoHome()
  })

  it('bouton Annuler visible sur TrackingScreen pour commande "pending"', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.id('cancel-order-btn'))).toBeVisible()
  })

  it('confirmation de l\'annulation → PATCH /cancel → statut "Annulé"', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await element(by.id('cancel-order-btn')).tap()

    // Confirmation dialog
    await waitFor(element(by.text(/annuler la commande|confirmer/i))).toBeVisible().withTimeout(3000)
    await element(by.id('cancel-confirm-btn')).tap()

    expect(mockServer.calledOnce('PATCH', `/api/v1/orders/${ORDER.id}/cancel`)).toBe(true)
    await waitFor(element(by.text(/annulé|commande annulée/i))).toBeVisible().withTimeout(5000)
  })

  it('bouton Annuler masqué pour une commande déjà "delivered"', async () => {
    mockServer.reset()
    stubOrderFlow(mockServer)
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, {
      ...ORDER, status: 'delivered',
    })

    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })
    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)

    await detoxExpect(element(by.id('cancel-order-btn'))).not.toBeVisible()
  })
})
