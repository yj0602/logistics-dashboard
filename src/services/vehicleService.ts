import { mockEtaPredictions, mockVehicles } from '../mocks/vehicles'
import type { UserRole } from '../types/auth'
import type { EtaPrediction, VehicleWithEta } from '../types/vehicle'

const EMPLOYEE_HUB_ID = 'HUB-ULSAN'

/** 현재 시각에서 minutes분 전 시각을 HH:mm 형식으로 반환 */
function getRelativeTime(minutesAgo: number): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() - minutesAgo)
  return now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function createEmptyEtaPrediction(vehicleId: string): EtaPrediction {
  return {
    vehicleId,
    estimatedArrivalTime: null,
    delayMinutes: 0,
    predictionUpdatedAt: '-',
  }
}

export async function getVehicles(
  role: UserRole = 'ADMIN',
  employeeHubId = EMPLOYEE_HUB_ID,
): Promise<VehicleWithEta[]> {
  const scopedVehicles =
    role === 'EMPLOYEE'
      ? mockVehicles.filter((vehicle) => vehicle.destinationHubId === employeeHubId)
      : mockVehicles

  return scopedVehicles.map((vehicle, index) => {
    const eta =
      mockEtaPredictions.find((e) => e.vehicleId === vehicle.vehicleId) ??
      createEmptyEtaPrediction(vehicle.vehicleId)

    return {
      ...vehicle,
      // 위치 갱신 시각: 현재로부터 0~2분 전 (차량마다 약간 다르게)
      locationUpdatedAt: getRelativeTime(index % 3),
      eta: {
        ...eta,
        predictionUpdatedAt: eta.predictionUpdatedAt === '-'
          ? '-'
          : getRelativeTime(1),
      },
    }
  })
}

export async function getVehicleById(
  vehicleId: string,
): Promise<VehicleWithEta | undefined> {
  const vehicles = await getVehicles('ADMIN')

  return vehicles.find((vehicle) => vehicle.vehicleId === vehicleId)
}
