import * as THREE from 'three'

const vertexShader = `
  attribute float aSize;
  varying vec3 vColor;
  uniform float uPointScale;
  uniform float uSizeAttenuation;

  void main() {
    vColor = color;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;

    float attenuation = mix(1.0, uPointScale / max(1.0, -viewPosition.z), uSizeAttenuation);
    gl_PointSize = clamp(aSize * attenuation, 1.0, 64.0);
  }
`

const fragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;
  uniform float uGlow;

  void main() {
    vec2 centered = gl_PointCoord - vec2(0.5);
    float distanceFromCenter = length(centered) * 2.0;
    if (distanceFromCenter > 1.0) discard;

    float softEdge = 1.0 - smoothstep(0.55, 1.0, distanceFromCenter);
    float glow = exp(-4.0 * distanceFromCenter * distanceFromCenter);
    float alpha = mix(softEdge, max(softEdge, glow), uGlow) * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`

/**
 * Owns particle GPU resources and environment-specific render overlays.
 */
export class ParticleRenderer {
  constructor(particles, environment) {
    this.particles = particles
    this.environment = environment
    this.maxCount = particles.length
    this.activeCount = this.maxCount
    this.profile = environment.visual.renderMode
    this.group = new THREE.Group()
    this.group.name = `particles-${environment.id}`

    this.geometry = new THREE.BufferGeometry()
    this.positions = new Float32Array(this.maxCount * 3)
    this.colors = new Float32Array(this.maxCount * 3)
    this.sizes = new Float32Array(this.maxCount)

    for (let i = 0; i < this.maxCount; i++) {
      const particle = particles[i]
      const i3 = i * 3
      this.positions[i3] = particle.position.x
      this.positions[i3 + 1] = particle.position.y
      this.positions[i3 + 2] = particle.position.z
      this.colors[i3] = particle.color.r
      this.colors[i3 + 1] = particle.color.g
      this.colors[i3 + 2] = particle.color.b
      this.sizes[i] = particle.size || environment.visual.particleSize
    }

    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3)
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 3)
    this.sizeAttribute = new THREE.BufferAttribute(this.sizes, 1)
    this.geometry.setAttribute('position', this.positionAttribute)
    this.geometry.setAttribute('color', this.colorAttribute)
    this.geometry.setAttribute('aSize', this.sizeAttribute)

    const additiveProfiles = new Set(['glow', 'stars', 'trails', 'hypercube'])
    const glowProfiles = new Set(['glow', 'stars', 'trails'])
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: environment.visual.opacity },
        uGlow: {
          value: glowProfiles.has(this.profile)
            ? Math.max(0, Math.min(1, environment.visual.emissiveIntensity))
            : 0.25
        },
        uPointScale: { value: environment.visual.pointScale ?? 12 },
        uSizeAttenuation: { value: environment.visual.sizeAttenuation ? 1 : 0 }
      },
      vertexShader,
      fragmentShader,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: additiveProfiles.has(this.profile)
        ? THREE.AdditiveBlending
        : THREE.NormalBlending
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.frustumCulled = false
    this.group.add(this.points)

    this.connectionGeometry = null
    this.connectionMaterial = null
    this.connectionPairs = null
    this.connectionIndexArray = null
    this.trailGeometry = null
    this.trailMaterial = null
    this.trailPositions = null
    this.previousPositions = null

    this.initializeProfileOverlay()
    this.setActiveCount(this.activeCount)
  }

  initializeProfileOverlay() {
    if (this.profile === 'lattice') {
      const dimension = Math.round(Math.cbrt(this.maxCount))
      if (dimension ** 3 !== this.maxCount) return
      const pairs = []
      const indexAt = (x, y, z) => x + y * dimension + z * dimension * dimension

      for (let z = 0; z < dimension; z++) {
        for (let y = 0; y < dimension; y++) {
          for (let x = 0; x < dimension; x++) {
            const current = indexAt(x, y, z)
            if (x + 1 < dimension) pairs.push(current, indexAt(x + 1, y, z))
            if (y + 1 < dimension) pairs.push(current, indexAt(x, y + 1, z))
            if (z + 1 < dimension) pairs.push(current, indexAt(x, y, z + 1))
          }
        }
      }
      this.createConnectionOverlay(pairs, 0.16)
    } else if (this.profile === 'surface') {
      const dimension = Math.round(Math.sqrt(this.maxCount))
      if (dimension ** 2 !== this.maxCount) return
      const pairs = []
      for (let y = 0; y < dimension; y++) {
        for (let x = 0; x < dimension; x++) {
          const current = x + y * dimension
          if (x + 1 < dimension) pairs.push(current, current + 1)
          if (y + 1 < dimension) pairs.push(current, current + dimension)
        }
      }
      this.createConnectionOverlay(pairs, 0.12)
    } else if (this.profile === 'hypercube') {
      const grouped = new Map()
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i]
        if (!Number.isInteger(particle.connectionGroup)) continue
        let entries = grouped.get(particle.connectionGroup)
        if (!entries) {
          entries = []
          grouped.set(particle.connectionGroup, entries)
        }
        entries.push({ index: i, order: particle.connectionOrder || 0 })
      }

      const pairs = []
      for (const entries of grouped.values()) {
        entries.sort((a, b) => a.order - b.order)
        for (let i = 1; i < entries.length; i++) {
          pairs.push(entries[i - 1].index, entries[i].index)
        }
      }
      this.createConnectionOverlay(pairs, 0.28)
    } else if (this.profile === 'trails') {
      this.createTrailOverlay()
    }
  }

  createConnectionOverlay(pairs, opacity) {
    this.connectionPairs = new Uint16Array(pairs)
    this.connectionIndexArray = new Uint16Array(pairs.length)
    this.connectionGeometry = new THREE.BufferGeometry()
    this.connectionGeometry.setAttribute('position', this.positionAttribute)
    this.connectionGeometry.setAttribute('color', this.colorAttribute)
    this.connectionGeometry.setIndex(new THREE.BufferAttribute(this.connectionIndexArray, 1))
    this.connectionMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const lines = new THREE.LineSegments(this.connectionGeometry, this.connectionMaterial)
    lines.frustumCulled = false
    this.group.add(lines)
  }

  createTrailOverlay() {
    this.trailPositions = new Float32Array(this.maxCount * 6)
    this.previousPositions = new Float32Array(this.positions)
    this.trailGeometry = new THREE.BufferGeometry()
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3))
    this.trailMaterial = new THREE.LineBasicMaterial({
      color: this.environment.visual.emissive || 0xff8c42,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
    const trails = new THREE.LineSegments(this.trailGeometry, this.trailMaterial)
    trails.frustumCulled = false
    this.group.add(trails)
  }

  sync(activeCount = this.activeCount) {
    const count = Math.min(activeCount, this.maxCount)
    for (let i = 0; i < count; i++) {
      const particle = this.particles[i]
      const i3 = i * 3

      if (this.trailPositions) {
        const i6 = i * 6
        this.trailPositions[i6] = this.previousPositions[i3]
        this.trailPositions[i6 + 1] = this.previousPositions[i3 + 1]
        this.trailPositions[i6 + 2] = this.previousPositions[i3 + 2]
        this.trailPositions[i6 + 3] = particle.position.x
        this.trailPositions[i6 + 4] = particle.position.y
        this.trailPositions[i6 + 5] = particle.position.z
        this.previousPositions[i3] = particle.position.x
        this.previousPositions[i3 + 1] = particle.position.y
        this.previousPositions[i3 + 2] = particle.position.z
      }

      this.positions[i3] = particle.position.x
      this.positions[i3 + 1] = particle.position.y
      this.positions[i3 + 2] = particle.position.z
    }

    this.positionAttribute.needsUpdate = true
    if (this.trailGeometry) {
      this.trailGeometry.attributes.position.needsUpdate = true
    }
  }

  setActiveCount(count) {
    this.activeCount = Math.max(0, Math.min(this.maxCount, Math.floor(count)))
    this.geometry.setDrawRange(0, this.activeCount)

    if (this.trailGeometry) {
      this.trailGeometry.setDrawRange(0, this.activeCount * 2)
    }

    if (this.connectionGeometry && this.connectionPairs) {
      let visibleIndexCount = 0
      for (let i = 0; i < this.connectionPairs.length; i += 2) {
        if (this.connectionPairs[i] < this.activeCount &&
            this.connectionPairs[i + 1] < this.activeCount) {
          this.connectionIndexArray[visibleIndexCount++] = this.connectionPairs[i]
          this.connectionIndexArray[visibleIndexCount++] = this.connectionPairs[i + 1]
        }
      }
      this.connectionGeometry.index.needsUpdate = true
      this.connectionGeometry.setDrawRange(0, visibleIndexCount)
    }
  }

  getObject3D() {
    return this.group
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
    if (this.connectionGeometry) this.connectionGeometry.dispose()
    if (this.connectionMaterial) this.connectionMaterial.dispose()
    if (this.trailGeometry) this.trailGeometry.dispose()
    if (this.trailMaterial) this.trailMaterial.dispose()
    this.group.clear()
  }
}
