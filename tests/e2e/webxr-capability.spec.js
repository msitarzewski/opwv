import { expect, test } from '@playwright/test'
import { installXRCapability } from '../fixtures/browser.js'

test('shows immersive entry only after a positive capability check', async ({ page }) => {
  await installXRCapability(page, { supported: true })
  await page.goto('/')

  const enter = page.getByRole('button', { name: /Enter immersive mode/i })
  await expect(enter).toBeEnabled()
  await expect(page.locator('#xr-status')).toContainText(/ready|available/i)
})

test('returns to a retryable state after permission denial', async ({ page }) => {
  await installXRCapability(page, { supported: true })
  await page.goto('/')

  const enter = page.getByRole('button', { name: /Enter immersive mode/i })
  await enter.click()
  await expect(page.locator('#app-error')).toBeVisible()
  await expect(enter).toBeEnabled()
})
