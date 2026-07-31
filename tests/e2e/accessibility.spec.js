import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { installXRCapability } from '../fixtures/browser.js'

test.beforeEach(async ({ page }) => {
  await installXRCapability(page, { supported: false })
})

test('has no serious or critical automated accessibility violations', async ({ page, browserName }) => {
  await page.goto('/')
  const axe = new AxeBuilder({ page })
  // axe-core cannot resolve a composited canvas backdrop in WebKit and assumes
  // white. Chromium and Firefox retain the native rule; WebKit verifies the
  // two reported nodes directly against their authored computed backgrounds.
  if (browserName === 'webkit') axe.disableRules(['color-contrast'])
  const results = await axe.analyze()
  const blocking = results.violations.filter(violation =>
    ['serious', 'critical'].includes(violation.impact)
  )
  expect(blocking).toEqual([])

  if (browserName === 'webkit') {
    for (const [selector, backgroundSelector] of [
      ['.brand', 'html'],
      ['.skip-link', '.skip-link']
    ]) {
      const colors = await page.locator(selector).evaluate((element, background) => {
        const foreground = getComputedStyle(element).color
        const backgroundColor = getComputedStyle(
          document.querySelector(background)
        ).backgroundColor
        return { foreground, background: backgroundColor }
      }, backgroundSelector)
      expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5)
    }
  }
})

test('exposes a complete keyboard path and visible focus', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.locator('.skip-link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#landing-panel')).toBeFocused()

  const controls = page.locator('button:not([disabled])')
  expect(await controls.count()).toBeGreaterThan(3)
  for (let index = 0; index < await controls.count(); index++) {
    await controls.nth(index).focus()
    await expect(controls.nth(index)).toBeFocused()
  }
})

function contrastRatio(foreground, background) {
  const luminance = color => {
    const channels = color.match(/\d+(?:\.\d+)?/g).slice(0, 3).map(Number)
    const linear = channels.map(channel => {
      const value = channel / 255
      return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
  }
  const first = luminance(foreground)
  const second = luminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}
