import { apiGet } from './apiClient'
import { mockEtaPredictions, mockVehicles } from '../mocks/vehicles'
import type { UserRole } from '../types/auth'
import type { VehicleApiResponse } from '../types/api'
import type { EtaPrediction, Vehicle, VehicleWithEta } from '../types/vehicle'

const EMPLOYEE_HUB_ID = 'HUB074'

/**
 * API 응답을 프론트 Vehicle 타입으로 변환.
 * API에는 x, y 좌표가 없으므로 0으로 설정한다.
 * API의 route가 빈 배열이면 출발→현재→도착 경로를 생성하지 않는다.
 */
function mapVehicleResponse(apiVehicle: VehicleApiResponse): Vehicle {
  return {
    vehicleId: apiVehicle.vehicleId,
    departureHubId: apiVehicle.departureHubId,
    destinationHubId: apiVehicle.destinationHubId,
    status: apiVehicle.status,
    currentLocation: {
      lat: apiVehicle.currentLocation.latitude,
      lng: apiVehicle.currentLocation.longitude,
      x: 0,
      y: 0,
    },
    route: apiVehicle.route.map((point) => ({
      lat: point.latitude,
      lng: point.longitude,
      x: 0,
      y: 0,
      label: point.label,
    })),
    currentRoad: apiVehicle.currentRoad,
    speedKmh: apiVehicle.speedKmh,
    remainingDistanceKm: apiVehicle.remainingDistanceKm,
    locationUpdatedAt: apiVehicle.locationUpdatedAt,
  }
}

function createEmptyEtaPrediction(vehicleId: string): EtaPrediction {
  return {
    vehicleId,
    estimatedArrivalTime: null,
    delayMinutes: 0,
    predictionUpdatedAt: '-',
  }
}

/**
 * 차량에 ETA 정보를 결합한다.
 * 현재 ETA는 별도 API가 없으므로 mock ETA를 사용.
 * 추후 ETA 예측 API가 제공되면 교체 예정.
 */
function attachEta(vehicle: Vehicle): VehicleWithEta {
  const eta =
    mockEtaPredictions.find((e) => e.vehicleId === vehicle.vehicleId) ??
    createEmptyEtaPrediction(vehicle.vehicleId)

  return {
    ...vehicle,
    eta,
  }
}

/**
 * 전체 차량 목록을 조회한다.
 * role이 EMPLOYEE이면 해당 허브로 향하는 차량만 필터링.
 * API 호출 실패 시 mock 데이터로 fallback.
 */
export async function getVehicles(
  role: UserRole = 'ADMIN',
  employeeHubId = EMPLOYEE_HUB_ID,
): Promise<VehicleWithEta[]> {
  let vehicles: Vehicle[]

  try {
    const response = await apiGet<VehicleApiResponse[]>('/vehicles')
    vehicles = response.map(mapVehicleResponse)
  } catch (err) {
    console.warn('[VehicleService] API 호출 실패, mock 데이터 사용:', err)
    vehicles = mockVehicles
  }

  const scopedVehicles =
    role === 'EMPLOYEE'
      ? vehicles.filter((vehicle) => vehicle.destinationHubId === employeeHubId)
      : vehicles

  return scopedVehicles.map(attachEta)
}

/**
 * 특정 차량 상세를 조회한다.
 * API 호출 실패 시 전체 목록에서 검색.
 */
export async function getVehicleById(
  vehicleId: string,
): Promise<VehicleWithEta | undefined> {
  try {
    const response = await apiGet<VehicleApiResponse>(`/vehicles/${encodeURIComponent(vehicleId)}`)
    const vehicle = mapVehicleResponse(response)
    return attachEta(vehicle)
  } catch (err) {
    console.warn('[VehicleService] 단일 차량 API 호출 실패, 전체 목록에서 검색:', err)
    const vehicles = await getVehicles('ADMIN')
    return vehicles.find((vehicle) => vehicle.vehicleId === vehicleId)
  }
}
