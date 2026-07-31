import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  endVRSession,
  getBrowserInfo,
  getVRModeFromURL,
  getWebXRSupportStatus,
  isVRSessionSupported,
  isWebXRSupported,
  requestVRSession
} from '../../src/utils/webxr.js'

describe('WebXR utilities', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true
    })
    Object.defineProperty(navigator, 'xr', {
      configurable: true,
      writable: true,
      value: undefined
    })
  })

  it('requires both a secure context and the XR API', () => {
    expect(isWebXRSupported()).toBe(true)
    expect(getWebXRSupportStatus()).toBe('supported')

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false
    })
    expect(isWebXRSupported()).toBe(false)
    expect(getWebXRSupportStatus()).toBe('insecure-context')

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true
    })
    delete navigator.xr
    expect(getWebXRSupportStatus()).toBe('api-unavailable')
  })

  it('parses explicit VR mode and identifies browser families', () => {
    window.history.replaceState({}, '', '/?mode=vr')
    expect(getVRModeFromURL()).toBe(true)
    expect(getBrowserInfo()).toMatchObject({
      webxrSupported: true,
      supportStatus: 'supported'
    })
  })

  it('handles support success and rejection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    navigator.xr = {
      isSessionSupported: vi.fn().mockResolvedValue(true)
    }
    await expect(isVRSessionSupported()).resolves.toBe(true)
    navigator.xr.isSessionSupported.mockRejectedValueOnce(new Error('blocked'))
    await expect(isVRSessionSupported()).resolves.toBe(false)
    expect(warn).toHaveBeenCalled()
  })

  it('coalesces session requests and connects the renderer once', async () => {
    let resolveSession
    const session = { end: vi.fn().mockResolvedValue(undefined) }
    navigator.xr = {
      requestSession: vi.fn(() => new Promise(resolve => { resolveSession = resolve }))
    }
    const renderer = {
      xr: {
        getSession: vi.fn(() => null),
        setSession: vi.fn().mockResolvedValue(undefined)
      }
    }

    const first = requestVRSession(renderer)
    const second = requestVRSession(renderer)
    resolveSession(session)
    await expect(first).resolves.toBe(session)
    await expect(second).resolves.toBe(session)
    expect(navigator.xr.requestSession).toHaveBeenCalledOnce()
    expect(renderer.xr.setSession).toHaveBeenCalledOnce()
  })

  it('ends a created session if renderer setup fails', async () => {
    const session = { end: vi.fn().mockResolvedValue(undefined) }
    navigator.xr = {
      requestSession: vi.fn().mockResolvedValue(session)
    }
    const renderer = {
      xr: {
        getSession: vi.fn(() => null),
        setSession: vi.fn().mockRejectedValue(new Error('renderer failed'))
      }
    }
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(requestVRSession(renderer)).resolves.toBeNull()
    expect(session.end).toHaveBeenCalledOnce()
  })

  it('makes session termination idempotent', async () => {
    let resolveEnd
    const session = {
      end: vi.fn(() => new Promise(resolve => { resolveEnd = resolve }))
    }
    const first = endVRSession(session)
    const second = endVRSession(session)
    resolveEnd()
    await Promise.all([first, second])
    expect(session.end).toHaveBeenCalledOnce()
  })
})
