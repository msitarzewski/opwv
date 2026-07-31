import { afterEach, vi } from 'vitest'

const createCanvasContext = () => ({
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  fill: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  measureText: vi.fn(text => ({ width: String(text).length * 10 })),
  moveTo: vi.fn(),
  roundRect: vi.fn(),
  stroke: vi.fn(),
  strokeRect: vi.fn(),
  arc: vi.fn(),
  setTransform: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn()
})

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => createCanvasContext())
})

const localStorageData = new Map()
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    clear: () => localStorageData.clear(),
    getItem: key => localStorageData.has(String(key))
      ? localStorageData.get(String(key))
      : null,
    removeItem: key => localStorageData.delete(String(key)),
    setItem: (key, value) => localStorageData.set(String(key), String(value))
  }
})
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: window.localStorage
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
  window.localStorage.clear()
  vi.restoreAllMocks()
})
