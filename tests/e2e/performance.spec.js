import { expect, test } from '@playwright/test'
import { installXRCapability } from '../fixtures/browser.js'

test.beforeEach(async ({ page }) => {
  await installXRCapability(page, { supported: false })
})

test('starts within the browser load budget and avoids long startup tasks', async ({ page }) => {
  await page.addInitScript(() => {
    window.__longTasks = []
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        window.__longTasks.push(...list.getEntries().map(entry => entry.duration))
      })
      try {
        observer.observe({ type: 'longtask', buffered: true })
      } catch {
        // Long Task API is not available in every engine.
      }
    }
  })

  await page.goto('/')
  await page.locator('#app-status').waitFor()
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0]
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      load: navigation.loadEventEnd - navigation.startTime,
      longTasks: window.__longTasks || []
    }
  })

  expect(metrics.domContentLoaded).toBeLessThan(2000)
  expect(metrics.load).toBeLessThan(2000)
  // Headless browser tests share CPU/GPU resources; real 72 Hz frame-time
  // budgets are enforced during headset validation, while this catches hangs.
  expect(metrics.longTasks.filter(duration => duration > 500)).toHaveLength(0)
})
