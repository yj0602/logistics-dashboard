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

/** 대응 필요 허브 판단: 해당 허브에 도착 예정 차량 중 하나라도 조건에 해당하면 대응 필요 */
function countAlertHubs(hubs: Hub[], vehicles: VehicleWithEta[]): number {
  let count = 0

  for (const hub of hubs) {
    const hubVehicles = vehicles.filter(
      (v) => v.destinationHubId === hub.hubId && v.status !== 'ARRIVED',
    )

    const needsAttention = hubVehicles.some((vehicle) => {
      // 조건: 최종 차량 지연 15분 이상
      if (vehicle.eta.delayMinutes >= 15) return true

      return false
    })

    if (needsAttention) count++
  }

  return count
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
    alertHubCount: countAlertHubs(hubs, vehicles),
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
