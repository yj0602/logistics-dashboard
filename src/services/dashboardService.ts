import type {
  AdminDashboardData,
  EmployeeDashboardData,
  HubOperationSummary,
} from '../types/dashboard'
import type { Hub } from '../types/hub'
import type { VehicleWithEta } from '../types/vehicle'
import { getHubs } from './hubService'
import { getVehicles } from './vehicleService'

function getLastEta(vehicles: VehicleWithEta[]) {
  const etaTimes = vehicles
    .map((vehicle) => vehicle.eta.estimatedArrivalTime)
    .filter((eta): eta is string => Boolean(eta))
    .sort()

  return etaTimes.at(-1) ?? '-'
}

function buildHubSummary(hubs: Hub[], vehicles: VehicleWithEta[]): HubOperationSummary[] {
  return hubs.map((hub) => {
    const hubVehicles = vehicles.filter(
      (vehicle) => vehicle.destinationHubId === hub.hubId,
    )

    return {
      hubId: hub.hubId,
      arrivedVehicles: hubVehicles.filter((vehicle) => vehicle.status === 'ARRIVED')
        .length,
      inTransitVehicles: hubVehicles.filter(
        (vehicle) => vehicle.status === 'IN_TRANSIT',
      ).length,
      delayedVehicles: hubVehicles.filter((vehicle) => vehicle.status === 'DELAYED')
        .length,
      lastVehicleEta: getLastEta(hubVehicles),
    }
  })
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const [vehicles, hubs] = await Promise.all([
    getVehicles('ADMIN'),
    getHubs(),
  ])

  const delayedVehicles = vehicles
    .filter((vehicle) => vehicle.status === 'DELAYED')
    .sort((a, b) => b.eta.delayMinutes - a.eta.delayMinutes)

  return {
    summary: {
      totalVehicles: vehicles.length,
      arrivedVehicles: vehicles.filter((vehicle) => vehicle.status === 'ARRIVED')
        .length,
      inTransitVehicles: vehicles.filter(
        (vehicle) => vehicle.status === 'IN_TRANSIT',
      ).length,
      delayedVehicles: delayedVehicles.length,
      lastVehicleEta: getLastEta(vehicles),
      predictionUpdatedAt: getCurrentTime(),
    },
    delayedVehicles,
    vehicles,
    mapHubs: hubs,
    hubs: buildHubSummary(hubs, vehicles),
  }
}

export async function getEmployeeDashboardData(
  employeeHubId = 'HUB074',
): Promise<EmployeeDashboardData> {
  const [vehicles, hubs] = await Promise.all([
    getVehicles('EMPLOYEE', employeeHubId),
    getHubs(),
  ])

  const delayedVehicles = vehicles
    .filter((vehicle) => vehicle.status === 'DELAYED')
    .sort((a, b) => b.eta.delayMinutes - a.eta.delayMinutes)
  const hub = hubs.find((item) => item.hubId === employeeHubId)

  return {
    hubId: employeeHubId,
    hubName: hub?.name ?? employeeHubId,
    summary: {
      totalVehicles: vehicles.length,
      arrivedVehicles: vehicles.filter((vehicle) => vehicle.status === 'ARRIVED')
        .length,
      inTransitVehicles: vehicles.filter(
        (vehicle) => vehicle.status === 'IN_TRANSIT',
      ).length,
      delayedVehicles: delayedVehicles.length,
      lastVehicleEta: getLastEta(vehicles),
      predictionUpdatedAt: getCurrentTime(),
    },
    delayedVehicles,
    vehicles,
    mapHubs: hubs.filter((item) => item.hubId === employeeHubId),
  }
}
