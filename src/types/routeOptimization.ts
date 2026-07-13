export interface LocationPoint {
  latitude: number
  longitude: number
}

export interface DestinationData {
  destinationId: string
  name: string
  address: string
  latitude: number
  longitude: number
  deadline: string | null
  priority: number
  serviceTimeMinutes: number
  plannedSequence: number | null
}

export interface RouteOptimizationInput {
  driverId: string
  optimizationMode: 'FASTEST' | 'SHORTEST'
  startLocation: LocationPoint
  destinations: DestinationData[]
}

export interface OptimizedWaypoint {
  destinationId: string
  optimizedSequence: number
  originalSequence: number | null
}

export interface RouteOptimizationResult {
  optimizedOrder: OptimizedWaypoint[]
  totalDistanceMeters: number
  totalDurationSeconds: number
}

export interface RouteGeometry {
  coordinates: [number, number][] // [longitude, latitude]
}
