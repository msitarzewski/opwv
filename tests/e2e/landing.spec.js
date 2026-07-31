import { expect, test } from '@playwright/test'
import { installXRCapability, monitorPage } from '../fixtures/browser.js'

test.beforeEach(async ({ page }) => {
  await installXRCapability(page, { supported: false })
})

test('loads a useful non-XR experience without runtime failures', async ({ page }) => {
  const errors = monitorPage(page)
  await page.goto('/?seed=42')

  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Step inside a living field of light.'
  })).toBeVisible()
  await expect(page.locator('#canvas')).toHaveAttribute(
    'aria-label',
    'Live generative particle preview'
  )
  await expect(page.locator('#enter-vr-button')).toBeDisabled()
  await expect(page.locator('#enter-vr-button')).toHaveText('Headset unavailable')
  await expect(page.locator('#xr-status')).toContainText(
    /No immersive headset is available|Immersive headset unavailable/i
  )
  expect(errors).toEqual([])
})

test('supports keyboard environment selection and canonical scene URLs', async ({ page }) => {
  await page.goto('/?seed=42')
  const ocean = page.getByRole('option', { name: 'Ocean' })
  await ocean.focus()
  await ocean.press('Enter')

  await expect(ocean).toHaveAttribute('aria-selected', 'true')
  await expect(page).toHaveURL(/env=ocean/)
  await expect(page).toHaveURL(/seed=42/)
})

test('pauses and resumes the preview with an accessible pressed state', async ({ page }) => {
  await page.goto('/')
  const pause = page.locator('#pause-preview-button')
  await pause.click()
  await expect(pause).toHaveAttribute('aria-pressed', 'true')
  await pause.click()
  await expect(pause).toHaveAttribute('aria-pressed', 'false')
})

test('remains usable on a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/')
  await expect(page.locator('#landing-panel')).toBeVisible()
  await expect(page.locator('#environment-list')).toBeVisible()
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 320)
})
