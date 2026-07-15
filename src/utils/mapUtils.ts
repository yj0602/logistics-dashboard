/**
 * Map-related utility functions for vehicle movement visualization.
 */

/**
 * Calculates the bearing (direction angle) from one coordinate to another.
 * Uses the Haversine-based forward azimuth formula.
 *
 * @param from - Starting point { lat, lng } in degrees
 * @param to - Ending point { lat, lng } in degrees
 * @returns Bearing in degrees (0 = North, 90 = East, 180 = South, 270 = West)
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const toDeg = (rad: number) => (rad * 180) / Math.PI

  const lat1 = toRad(from.lat)
  const lat2 = toRad(to.lat)
  const dLng = toRad(to.lng - from.lng)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  const bearing = toDeg(Math.atan2(y, x))
  return (bearing + 360) % 360
}

/**
 * Linearly interpolates between two coordinate points.
 *
 * @param from - Starting point { lat, lng }
 * @param to - Ending point { lat, lng }
 * @param t - Interpolation factor (0 = from, 1 = to)
 * @returns Interpolated { lat, lng }
 */
export function interpolatePosition(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  const clamped = Math.max(0, Math.min(1, t))
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
  }
}

/**
 * Checks whether two coordinates are effectively the same position.
 * Used to detect if a vehicle is stationary.
 *
 * @param a - First point
 * @param b - Second point
 * @param threshold - Minimum difference to consider as moved (default ~11m)
 */
export function isSamePosition(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  threshold = 0.0001,
): boolean {
  return (
    Math.abs(a.lat - b.lat) < threshold &&
    Math.abs(a.lng - b.lng) < threshold
  )
}
