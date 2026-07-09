import type { MapPoint } from './hub'

export type VehicleStatus = 'ARRIVED' | 'IN_TRANSIT' | 'DELAYED'

export interface VehicleRoutePoint extends MapPoint {
  label: string
}

export interface Vehicle {
  vehicleId: string
  departureHubId: string
  destinationHubId: string
  status: VehicleStatus
  currentLocation: MapPoint
  route: VehicleRoutePoint[]
  currentRoad: string
  speedKmh: number
  remainingDistanceKm: number
  locationUpdatedAt: string
}

export interface EtaPrediction {
  vehicleId: string
  estimatedArrivalTime: string | null
  delayMinutes: number
  predictionUpdatedAt: string
  confidence?: number
  delayReason?: string
}

export interface VehicleWithEta extends Vehicle {
  eta: EtaPrediction
}
