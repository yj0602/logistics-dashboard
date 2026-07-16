import { apiGet } from './apiClient'
import { mockEtaPredictions, mockVehicles } from '../mocks/vehicles'
import type { UserRole } from '../types/auth'
import type {
  EtaPredictionApiResponse,
  GetEtaPredictionsResponse,
  VehicleApiResponse,
} from '../types/api'
import type { EtaPrediction, Vehicle, VehicleWithEta } from '../types/vehicle'
import { DEMO_CURRENT_TIME } from '../utils/demoTime'

const EMPLOYEE_HUB_ID = 'HUB056'

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
 * ETA 시각과 데모 기준 스케줄 시각의 차이를 분 단위로 계산한다.
 * ETA가 기준 시각보다 늦으면 양수(지연), 이전이면 0.
 * HH:mm 형식 또는 ISO 8601 형식 모두 지원.
 */
function calculateDelayFromSchedule(etaTimeStr: string): number {
  const [baseHour, baseMin] = DEMO_CURRENT_TIME.split(':').map(Number)
  const baseTotalMin = baseHour * 60 + baseMin

  // HH:mm 형식
  const shortMatch = etaTimeStr.match(/^(\d{2}):(\d{2})$/)
  if (shortMatch) {
    const etaTotalMin = parseInt(shortMatch[1], 10) * 60 + parseInt(shortMatch[2], 10)
    const diff = etaTotalMin - baseTotalMin
    return diff > 0 ? diff : 0
  }

  // ISO 8601 형식
  try {
    const date = new Date(etaTimeStr)
    if (isNaN(date.getTime())) return 0
    const etaTotalMin = date.getHours() * 60 + date.getMinutes()
    const diff = etaTotalMin - baseTotalMin
    return diff > 0 ? diff : 0
  } catch {
    return 0
  }
}

/**
 * ETA API 응답을 프론트 EtaPrediction 타입으로 변환한다.
 * API가 delayMinutes를 0으로 반환하는 경우,
 * estimatedArrivalTime과 데모 기준 시각(10:30)의 차이로 지연 분수를 계산한다.
 */
function mapEtaResponse(apiEta: EtaPredictionApiResponse): EtaPrediction {
  const formattedEta = apiEta.estimatedArrivalTime
    ? formatTimeToHHmm(apiEta.estimatedArrivalTime)
    : null

  // API delayMinutes가 유효한 값이면 그대로 사용, 0이면 직접 계산
  let delayMinutes = apiEta.delayMinutes
  if (delayMinutes === 0 && apiEta.estimatedArrivalTime && apiEta.status === 'DELAYED') {
    delayMinutes = calculateDelayFromSchedule(apiEta.estimatedArrivalTime)
  }

  return {
    vehicleId: apiEta.vehicleId,
    estimatedArrivalTime: formattedEta,
    delayMinutes,
    predictionUpdatedAt: formatTimeToHHmm(apiEta.predictionUpdatedAt),
    status: apiEta.status,
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
 * ETA API가 제공하는 status(DELAYED 등)를 차량 상태에 반영한다.
 */
function attachEtaFromPredictions(
  vehicles: Vehicle[],
  predictions: EtaPrediction[],
): VehicleWithEta[] {
  return vehicles.map((vehicle) => {
    const eta =
      predictions.find((p) => p.vehicleId === vehicle.vehicleId) ??
      createEmptyEtaPrediction(vehicle.vehicleId)

    // ETA API의 status가 DELAYED인 경우 차량 상태를 DELAYED로 갱신
    const resolvedStatus = eta.status === 'DELAYED' ? 'DELAYED' : vehicle.status

    return { ...vehicle, status: resolvedStatus, eta }
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
