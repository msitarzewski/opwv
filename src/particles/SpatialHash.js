/**
 * Uniform 3D spatial index used for bounded-radius neighbor queries.
 *
 * The hash is rebuilt once per simulation frame and reuses its buckets so the
 * flocking hot path does not perform an O(n²) scan for every particle.
 */
export class SpatialHash {
  constructor(cellSize = 1) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) {
      throw new Error('SpatialHash.cellSize must be a positive number')
    }

    this.cellSize = cellSize
    this.inverseCellSize = 1 / cellSize
    this.buckets = new Map()
    this.bucketPool = []
  }

  setCellSize(cellSize) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) {
      throw new Error('SpatialHash.cellSize must be a positive number')
    }

    if (cellSize !== this.cellSize) {
      this.cellSize = cellSize
      this.inverseCellSize = 1 / cellSize
      this.buckets.clear()
      this.bucketPool.length = 0
    }
  }

  getCellCoordinate(value) {
    return Math.floor(value * this.inverseCellSize)
  }

  getKey(x, y, z) {
    // Pack the normal signed-16-bit simulation range into one exact integer.
    // The fallback preserves correctness for callers using unusually large cells.
    if (x >= -32768 && x <= 32767 &&
        y >= -32768 && y <= 32767 &&
        z >= -32768 && z <= 32767) {
      return (x + 32768) * 4294967296 + (y + 32768) * 65536 + (z + 32768)
    }
    return `${x},${y},${z}`
  }

  rebuild(particles, count = particles.length) {
    for (const bucket of this.buckets.values()) {
      bucket.length = 0
      this.bucketPool.push(bucket)
    }
    this.buckets.clear()

    for (let i = 0; i < count; i++) {
      const particle = particles[i]
      const position = particle.position
      const key = this.getKey(
        this.getCellCoordinate(position.x),
        this.getCellCoordinate(position.y),
        this.getCellCoordinate(position.z)
      )

      let bucket = this.buckets.get(key)
      if (!bucket) {
        bucket = this.bucketPool.pop() || []
        this.buckets.set(key, bucket)
      }
      bucket.push(particle)
    }
  }

  query(position, radius, target = []) {
    target.length = 0

    const minX = this.getCellCoordinate(position.x - radius)
    const maxX = this.getCellCoordinate(position.x + radius)
    const minY = this.getCellCoordinate(position.y - radius)
    const maxY = this.getCellCoordinate(position.y + radius)
    const minZ = this.getCellCoordinate(position.z - radius)
    const maxZ = this.getCellCoordinate(position.z + radius)

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const bucket = this.buckets.get(this.getKey(x, y, z))
          if (!bucket) continue

          for (const particle of bucket) {
            target.push(particle)
          }
        }
      }
    }

    return target
  }

  clear() {
    this.buckets.clear()
    this.bucketPool.length = 0
  }
}
