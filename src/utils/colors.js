// Color palette generation using HSL color space
// Produces harmonious color schemes based on seeded randomness

import * as THREE from 'three'

/**
 * Generate a harmonious color palette using HSL color space
 *
 * Uses an analogous color scheme (related hues within a range)
 * to ensure visually pleasing, non-jarring color combinations.
 *
 * @param {SeededRandom} rng - Seeded random number generator for reproducibility
 * @param {number} paletteSize - Number of colors to generate (2-4 recommended)
 * @returns {THREE.Color[]} - Array of THREE.Color objects
 */
export function generatePalette(rng, paletteSize = 3) {
  // Validate palette size
  if (paletteSize < 2) paletteSize = 2
  if (paletteSize > 4) paletteSize = 4

  const colors = []

  // Base hue: random value 0-360 degrees (influenced by seed)
  const baseHue = rng.randomFloat(0, 360)

  // Hue spread: analogous color scheme uses related hues
  // Range: 30-90 degrees for harmonious variation without jarring contrasts
  const hueSpread = rng.randomFloat(30, 90)

  // Saturation range: 60-90% for vibrant but not oversaturated colors
  const saturationMin = 60
  const saturationMax = 90

  // Lightness range: 40-70% for visible colors that aren't too dark or washed out
  const lightnessMin = 40
  const lightnessMax = 70

  // Generate palette colors
  for (let i = 0; i < paletteSize; i++) {
    // Distribute hues evenly across the spread
    const hueOffset = (i / (paletteSize - 1)) * hueSpread
    const hue = (baseHue + hueOffset) % 360

    // Random saturation and lightness within safe bounds
    const saturation = rng.randomFloat(saturationMin, saturationMax)
    const lightness = rng.randomFloat(lightnessMin, lightnessMax)

    // Create color using Three.js HSL method
    const color = new THREE.Color()
    color.setHSL(hue / 360, saturation / 100, lightness / 100)

    colors.push(color)
  }

  return colors
}

/**
 * Pick a random color from a palette
 * @param {THREE.Color[]} palette - Array of colors
 * @param {SeededRandom} rng - Seeded random number generator
 * @returns {THREE.Color} - Selected color (cloned to avoid reference issues)
 */
export function pickColorFromPalette(palette, rng) {
  const index = rng.randomInt(0, palette.length)
  return palette[index].clone()
}
