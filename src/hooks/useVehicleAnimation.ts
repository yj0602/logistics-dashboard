import { useEffect, useRef } from 'react'
import type { VehicleWithEta } from '../types/vehicle'
import { calculateBearing, interpolatePosition, isSamePosition } from '../utils/mapUtils'

export interface AnimatedVehicleState {
  vehicleId: string
  /** Current display position (may be interpolating) */
  displayLat: number
  displayLng: number
  /** Target position (latest data) */
  targetLat: number
  targetLng: number
  /** Bearing in degrees (0=North). null if stationary/unknown. */
  bearing: number | null
  /** Whether the vehicle is currently moving */
  isMoving: boolean
}

interface InternalVehicleState {
  previousLat: number
  previousLng: number
  targetLat: number
  targetLng: number
  displayLat: number
  displayLng: number
  bearing: number | null
  isMoving: boolean
  /** Timestamp when the target was updated */
  targetUpdatedAt: number
}

/** Duration for the smooth interpolation animation (ms) */
const INTERPOLATION_DURATION = 1500

/**
 * Hook that manages animated vehicle positions for the map.
 * Tracks previous positions, calculates bearing, and smoothly interpolates
 * marker positions when vehicle data updates.
 *
 * @param vehicles - Current vehicle list from data source
 * @param enabled - Whether animation is active (disabled in compact mode)
 * @param onFrame - Callback fired each animation frame with updated states
 */
export function useVehicleAnimation(
  vehicles: VehicleWithEta[],
  enabled: boolean,
  onFrame: (states: Map<string, AnimatedVehicleState>) => void,
) {
  const statesRef = useRef<Map<string, InternalVehicleState>>(new Map())
  const animFrameRef = useRef<number>(0)
  const onFrameRef = useRef(onFrame)
  const enabledRef = useRef(enabled)
  const vehiclesRef = useRef(vehicles)

  // Keep refs in sync via effects
  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    vehiclesRef.current = vehicles
  }, [vehicles])

  // Update internal states when vehicle data changes
  useEffect(() => {
    if (!enabled) return

    const now = Date.now()
    const currentStates = statesRef.current

    for (const vehicle of vehicles) {
      const loc = vehicle.currentLocation
      if (!loc) continue

      const existing = currentStates.get(vehicle.vehicleId)
      const isMoving = vehicle.speedKmh > 0

      if (!existing) {
        // First time seeing this vehicle — initialize without animation
        currentStates.set(vehicle.vehicleId, {
          previousLat: loc.lat,
          previousLng: loc.lng,
          targetLat: loc.lat,
          targetLng: loc.lng,
          displayLat: loc.lat,
          displayLng: loc.lng,
          bearing: null,
          isMoving,
          targetUpdatedAt: now,
        })
      } else {
        // Vehicle exists — check if position changed
        const targetMoved = !isSamePosition(
          { lat: existing.targetLat, lng: existing.targetLng },
          { lat: loc.lat, lng: loc.lng },
        )

        if (targetMoved) {
          // Calculate bearing from old target to new target
          const bearing = calculateBearing(
            { lat: existing.targetLat, lng: existing.targetLng },
            { lat: loc.lat, lng: loc.lng },
          )

          existing.previousLat = existing.displayLat
          existing.previousLng = existing.displayLng
          existing.targetLat = loc.lat
          existing.targetLng = loc.lng
          existing.bearing = bearing
          existing.isMoving = isMoving
          existing.targetUpdatedAt = now
        } else {
          // Position didn't change — update movement status
          existing.isMoving = isMoving
          if (!isMoving) {
            // Snap to target if stopped
            existing.displayLat = existing.targetLat
            existing.displayLng = existing.targetLng
          }
        }
      }
    }

    // Remove vehicles that are no longer in the list
    const currentIds = new Set(vehicles.map((v) => v.vehicleId))
    for (const id of currentStates.keys()) {
      if (!currentIds.has(id)) {
        currentStates.delete(id)
      }
    }
  }, [vehicles, enabled])

  // Animation loop effect
  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(animFrameRef.current)
      return
    }

    let running = true

    function tick() {
      if (!running) return

      const now = Date.now()
      const states = statesRef.current
      let hasActiveAnimation = false

      for (const [, state] of states) {
        if (!state.isMoving) continue

        const elapsed = now - state.targetUpdatedAt
        const t = Math.min(elapsed / INTERPOLATION_DURATION, 1)

        if (t < 1) {
          hasActiveAnimation = true
          const interpolated = interpolatePosition(
            { lat: state.previousLat, lng: state.previousLng },
            { lat: state.targetLat, lng: state.targetLng },
            easeOutCubic(t),
          )
          state.displayLat = interpolated.lat
          state.displayLng = interpolated.lng
        } else {
          state.displayLat = state.targetLat
          state.displayLng = state.targetLng
        }
      }

      // Build output map
      const output = new Map<string, AnimatedVehicleState>()
      for (const [id, state] of states) {
        output.set(id, {
          vehicleId: id,
          displayLat: state.displayLat,
          displayLng: state.displayLng,
          targetLat: state.targetLat,
          targetLng: state.targetLng,
          bearing: state.bearing,
          isMoving: state.isMoving,
        })
      }

      onFrameRef.current(output)

      if (hasActiveAnimation && running) {
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [vehicles, enabled])
}

/** Easing function for smooth deceleration */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
