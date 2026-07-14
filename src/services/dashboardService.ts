import { mockHubs } from '../mocks/hubs'
import type {
  AdminDashboardData,
  EmployeeDashboardData,
  HubOperationSummary,
} from '../types/dashboard'
import type { VehicleWithEta } from '../types/vehicle'
import { getVehicles } from './vehicleService'

function getLastEta(vehicles: VehicleWithEta[]) {
  const etaTimes = vehicles
    .map((vehicle) => vehicle.eta.estimatedArrivalTime)
    .filter((eta): eta is string => Boolean(eta))
    .sort()

  return etaTimes.at(-1) ?? '-'
}

function buildHubSummary(vehicles: VehicleWithEta[]): HubOperationSummary[] {
  return mockHubs.map((hub) => {
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
  const vehicles = await getVehicles('ADMIN')
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
    mapHubs: mockHubs,
    hubs: buildHubSummary(vehicles),
  }
}

export async function getEmployeeDashboardData(
  employeeHubId = 'HUB-ULSAN',
): Promise<EmployeeDashboardData> {
  const vehicles = await getVehicles('EMPLOYEE', employeeHubId)
  const delayedVehicles = vehicles
    .filter((vehicle) => vehicle.status === 'DELAYED')
    .sort((a, b) => b.eta.delayMinutes - a.eta.delayMinutes)
  const hub = mockHubs.find((item) => item.hubId === employeeHubId)

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
    mapHubs: mockHubs.filter((item) => item.hubId === employeeHubId),
  }
}
