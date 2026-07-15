import { apiGet } from './apiClient'
import { mockEtaPredictions, mockVehicles } from '../mocks/vehicles'
import type { UserRole } from '../types/auth'
import type {
  EtaPredictionApiResponse,
  GetEtaPredictionsResponse,
  VehicleApiResponse,
} from '../types/api'
import type { EtaPrediction, Vehicle, VehicleWithEta } from '../types/vehicle'

const EMPLOYEE_HUB_ID = 'HUB074'

/**
 * ETA 예측 API 엔드포인트 (AI Agent).
 * 차량 위치 API와 별도 호스트이므로 전용 환경변수를 사용한다.
 */
const ETA_API_URL =
  import.meta.env.VITE_ETA_API_URL ??
  'https://7c9ge0cd58.execute-api.ap-northeast-2.amazonaws.com/prod'

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

/**
 * ISO 8601 시간 문자열을 HH:mm 형식으로 변환한다.
 * 이미 HH:mm 형식이면 그대로 반환.
 */
function formatTimeToHHmm(isoTime: string): string {
  // 이미 HH:mm 형식인 경우 (기존 mock 데이터 호환)
  if (/^\d{2}:\d{2}$/.test(isoTime)) return isoTime

  try {
    const date = new Date(isoTime)
    if (isNaN(date.getTime())) return isoTime
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return isoTime
  }
}

/**
 * ETA API 응답을 프론트 EtaPrediction 타입으로 변환한다.
 */
function mapEtaResponse(apiEta: EtaPredictionApiResponse): EtaPrediction {
  return {
    vehicleId: apiEta.vehicleId,
    estimatedArrivalTime: apiEta.estimatedArrivalTime
      ? formatTimeToHHmm(apiEta.estimatedArrivalTime)
      : null,
    delayMinutes: apiEta.delayMinutes,
    predictionUpdatedAt: formatTimeToHHmm(apiEta.predictionUpdatedAt),
    confidence: apiEta.confidence,
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
 * ETA 예측 API에서 전체 차량 ETA를 일괄 조회한다.
 * 실패 시 mock 데이터로 fallback.
 */
async function fetchEtaPredictions(): Promise<EtaPrediction[]> {
  try {
    const url = `${ETA_API_URL}/vehicles/eta`
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`ETA API HTTP ${response.status}`)
    }

    const data: GetEtaPredictionsResponse = await response.json()
    return data.predictions.map(mapEtaResponse)
  } catch (err) {
    console.warn('[VehicleService] ETA API 호출 실패, mock ETA 사용:', err)
    return mockEtaPredictions
  }
}

/**
 * 차량 목록에 ETA 정보를 결합한다.
 * ETA predictions 배열에서 vehicleId로 매칭.
 */
function attachEtaFromPredictions(
  vehicles: Vehicle[],
  predictions: EtaPrediction[],
): VehicleWithEta[] {
  return vehicles.map((vehicle) => {
    const eta =
      predictions.find((p) => p.vehicleId === vehicle.vehicleId) ??
      createEmptyEtaPrediction(vehicle.vehicleId)

    return { ...vehicle, eta }
  })
}

/**
 * 전체 차량 목록을 조회한다.
 * role이 EMPLOYEE이면 해당 허브로 향하는 차량만 필터링.
 * 차량 위치 API와 ETA 예측 API를 병렬 호출한다.
 * 각 API 호출 실패 시 개별적으로 mock 데이터로 fallback.
 */
export async function getVehicles(
  role: UserRole = 'ADMIN',
  employeeHubId = EMPLOYEE_HUB_ID,
): Promise<VehicleWithEta[]> {
  const [vehicles, predictions] = await Promise.all([
    fetchVehicles(),
    fetchEtaPredictions(),
  ])

  const scopedVehicles =
    role === 'EMPLOYEE'
      ? vehicles.filter((vehicle) => vehicle.destinationHubId === employeeHubId)
      : vehicles

  return attachEtaFromPredictions(scopedVehicles, predictions)
}

/**
 * 차량 위치/상태 데이터를 조회한다.
 * API 호출 실패 시 mock 데이터로 fallback.
 */
async function fetchVehicles(): Promise<Vehicle[]> {
  try {
    const response = await apiGet<VehicleApiResponse[]>('/vehicles')
    return response.map(mapVehicleResponse)
  } catch (err) {
    console.warn('[VehicleService] 차량 API 호출 실패, mock 데이터 사용:', err)
    return mockVehicles
  }
}

/**
 * 특정 차량 상세를 조회한다.
 * API 호출 실패 시 전체 목록에서 검색.
 */
export async function getVehicleById(
  vehicleId: string,
): Promise<VehicleWithEta | undefined> {
  try {
    const [response, predictions] = await Promise.all([
      apiGet<VehicleApiResponse>(`/vehicles/${encodeURIComponent(vehicleId)}`),
      fetchEtaPredictions(),
    ])
    const vehicle = mapVehicleResponse(response)
    const eta =
      predictions.find((p) => p.vehicleId === vehicle.vehicleId) ??
      createEmptyEtaPrediction(vehicle.vehicleId)
    return { ...vehicle, eta }
  } catch (err) {
    console.warn('[VehicleService] 단일 차량 API 호출 실패, 전체 목록에서 검색:', err)
    const vehicles = await getVehicles('ADMIN')
    return vehicles.find((vehicle) => vehicle.vehicleId === vehicleId)
  }
}
