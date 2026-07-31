import { expect, test } from '@playwright/test'
import { installXRCapability } from '../fixtures/browser.js'

test.beforeEach(async ({ page }) => {
  await installXRCapability(page, { supported: false })
})

test('serves browser security policy headers', async ({ request }) => {
  const response = await request.get('/')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect(response.headers()['referrer-policy']).toBe('no-referrer')
  expect(response.headers()['permissions-policy']).toContain('xr-spatial-tracking=(self)')
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
})

test('does not make third-party runtime requests', async ({ page }) => {
  const external = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.origin !== 'http://127.0.0.1:4173') {
      external.push(request.url())
    }
  })
  await page.goto('/?seed=%3Csvg%20onload%3Dalert(1)%3E&env=../../main&speed=Infinity')
  await page.waitForTimeout(500)
  expect(external).toEqual([])
  await expect(page.locator('script[src^="http"]')).toHaveCount(0)
})

test('rejects invalid Host headers', async ({ request }) => {
  const response = await request.get('/', {
    headers: { Host: 'attacker.invalid' }
  })
  expect(response.status()).toBeGreaterThanOrEqual(400)
})
