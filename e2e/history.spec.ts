/**
 * US-C07  Historique des commandes : liste paginée, filtre par statut,
 *         détail d'une commande passée
 */

import { device, element, by, expect as detoxExpect, waitFor } from 'detox'
import { mockServer } from './helpers/mockServer'
import {
  PHONE, VALID_OTP, AUTH_TOKENS, USER,
  ORDER, ORDER_DELIVERED, PAGINATED_ORDERS,
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

describe('US-C07 — Historique des commandes', () => {
  beforeEach(async () => {
    mockServer.stub('GET', '/api/v1/orders', 200, PAGINATED_ORDERS)
    mockServer.stub('GET', `/api/v1/orders/${ORDER.id}`, 200, ORDER_DELIVERED)
    await loginAndGoHome()
  })

  it('onglet Historique accessible depuis la navigation', async () => {
    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)
  })

  it('liste au moins une commande passée avec adresse et montant', async () => {
    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)

    await detoxExpect(element(by.text(/5 Rue de Thiong|12 Av Cheikh/i))).toBeVisible()
    await detoxExpect(element(by.text(/1.*200.*FCFA/i))).toBeVisible()
  })

  it('badge statut "Livré" visible pour la commande delivered', async () => {
    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)

    await detoxExpect(element(by.text(/livré/i))).toBeVisible()
  })

  it('filtre par statut "delivered" → GET /orders?status=delivered', async () => {
    mockServer.reset()
    stubAuthFlow(mockServer)
    mockServer.stub('GET', '/api/v1/orders', 200, PAGINATED_ORDERS)

    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)

    // Tap status filter
    await element(by.id('status-filter')).tap()
    await element(by.text(/livré/i)).tap()

    const calls = mockServer.received('GET', '/api/v1/orders')
    const filtered = calls.filter((c) => c.path.includes('status=delivered'))
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('tap sur une commande → écran détail avec adresses et prix', async () => {
    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)

    await element(by.id(`order-item-${ORDER.id}`)).tap()
    await waitFor(element(by.id('order-detail-screen'))).toBeVisible().withTimeout(5000)

    await detoxExpect(element(by.text('5 Rue de Thiong, Dakar'))).toBeVisible()
    await detoxExpect(element(by.text('12 Av Cheikh Anta Diop'))).toBeVisible()
    await detoxExpect(element(by.text(/1.*200.*FCFA/i))).toBeVisible()
  })

  it('scroll bas → load more si plusieurs pages (pagination)', async () => {
    mockServer.reset()
    stubAuthFlow(mockServer)
    // Page 1: return 10 items, totalPages: 2
    mockServer.stub('GET', '/api/v1/orders', 200, {
      data:       Array.from({ length: 10 }, (_, i) => ({ ...ORDER_DELIVERED, id: `ord-${i}` })),
      total:      15,
      page:       1,
      limit:      10,
      totalPages: 2,
    })

    await element(by.id('tab-history')).tap()
    await waitFor(element(by.id('history-screen'))).toBeVisible().withTimeout(5000)

    // Set up page 2 response before scrolling
    mockServer.stub('GET', '/api/v1/orders', 200, {
      data:       Array.from({ length: 5 }, (_, i) => ({ ...ORDER_DELIVERED, id: `ord-p2-${i}` })),
      total:      15,
      page:       2,
      limit:      10,
      totalPages: 2,
    })

    await element(by.id('orders-list')).scroll(500, 'down')

    const calls = mockServer.received('GET', '/api/v1/orders')
    const page2Calls = calls.filter((c) => c.path.includes('page=2'))
    expect(page2Calls.length).toBeGreaterThan(0)
  })
})
