export async function installXRCapability(page, { supported = false } = {}) {
  await page.addInitScript(({ supported: immersiveSupported }) => {
    const xr = {
      isSessionSupported: async mode =>
        mode === 'immersive-vr' && immersiveSupported,
      requestSession: async () => {
        throw new DOMException('Synthetic browser test denial', 'NotAllowedError')
      }
    }
    Object.defineProperty(navigator, 'xr', {
      configurable: true,
      value: xr
    })
  }, { supported })
}

export function monitorPage(page) {
  const errors = []
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`)
    }
  })
  page.on('requestfailed', request => {
    errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText})`)
  })
  return errors
}
