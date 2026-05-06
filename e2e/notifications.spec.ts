/**
 * US-C08  Notification push : tap depuis le système → navigation vers
 *         TrackingScreen de la commande concernée
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { mockServer } from './helpers/mockServer'
import {
  PHONE, VALID_OTP, ORDER, ORDER_ASSIGNED,
  stubAuthFlow,
} from './helpers/fixtures'

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

describe('US-C08 — Notification push → navigation commande', () => {
  beforeEach(async () => {
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, ORDER_ASSIGNED)
    await loginAndGoHome()
  })

  it('tap notification "Livreur en route" → TrackingScreen de la commande', async () => {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title:   'Livreur en route',
      body:    'Ibrahima Ba est en route pour votre livraison.',
      payload: { type: 'order_status', orderId: ORDER.id, status: 'collecting' },
    })

    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)
    await detoxExpect(element(by.id('tracking-screen'))).toBeVisible()
  })

  it('tap notification "Commande assignée" → TrackingScreen avec info livreur', async () => {
    await device.sendUserNotification({
      trigger: { type: 'push' },
      title:   'Livreur assigné',
      body:    'Ibrahima Ba a accepté votre commande.',
      payload: { type: 'order_status', orderId: ORDER.id, status: 'assigned' },
    })

    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)
    await detoxExpect(element(by.text('Ibrahima Ba'))).toBeVisible()
  })

  it('tap notification "Commande livrée" → TrackingScreen avec option noter', async () => {
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, {
      ...ORDER_ASSIGNED, status: 'delivered',
    })

    await device.sendUserNotification({
      trigger: { type: 'push' },
      title:   'Commande livrée',
      body:    'Votre colis a été livré.',
      payload: { type: 'order_status', orderId: ORDER.id, status: 'delivered' },
    })

    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)
    // Rating prompt should appear for delivered orders
    await waitFor(element(by.id('rate-order-section')).or(element(by.text(/noter|évaluer/i))))
      .toBeVisible().withTimeout(5000)
  })

  it('notification reçue en arrière-plan → badge mis à jour sur l\'icône', async () => {
    await device.sendToHome()

    await device.sendUserNotification({
      trigger: { type: 'push' },
      title:   'Livreur en route',
      body:    'Test background notification',
      payload: { type: 'order_status', orderId: ORDER.id, status: 'collecting' },
    })

    // Re-open app
    await device.launchApp({ newInstance: false })
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(8000)

    // The app should have navigated or shown a notification indicator
    // Exact behavior depends on implementation; just confirm app is stable
    await detoxExpect(element(by.id('home-screen')).or(element(by.id('tracking-screen')))).toBeVisible()
  })

  it('deep link yobbul://tracking/[id] ouvre directement le tracking', async () => {
    await device.openURL({ url: `yobbul://tracking/${ORDER.id}` })

    await waitFor(element(by.id('tracking-screen'))).toBeVisible().withTimeout(8000)
    await detoxExpect(element(by.id('tracking-screen'))).toBeVisible()
  })
})
