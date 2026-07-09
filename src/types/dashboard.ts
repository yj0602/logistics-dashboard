import type { VehicleWithEta } from './vehicle'
import type { Hub } from './hub'

export interface DashboardSummary {
  totalVehicles: number
  arrivedVehicles: number
  inTransitVehicles: number
  delayedVehicles: number
  lastVehicleEta: string
  predictionUpdatedAt: string
}

export interface HubOperationSummary {
  hubId: string
  arrivedVehicles: number
  inTransitVehicles: number
  delayedVehicles: number
  lastVehicleEta: string
}

export interface AdminDashboardData {
  summary: DashboardSummary
  delayedVehicles: VehicleWithEta[]
  vehicles: VehicleWithEta[]
  mapHubs: Hub[]
  hubs: HubOperationSummary[]
}

export interface EmployeeDashboardData {
  hubId: string
  hubName: string
  summary: DashboardSummary
  delayedVehicles: VehicleWithEta[]
  vehicles: VehicleWithEta[]
  mapHubs: Hub[]
}
