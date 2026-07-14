/**
 * 백엔드 API 응답 타입 정의
 *
 * 프론트 내부 타입(Hub, Vehicle 등)과 분리하여 관리한다.
 * API 응답 → 프론트 타입 변환은 서비스 계층 또는 mapper에서 수행.
 *
 * ETA 예측은 AI agent 영역이므로 이 파일에 포함하지 않는다.
 */

// ─── 허브 API ───────────────────────────────────────────

/**
 * GET /hubs
 * 전체 허브 목록 조회
 */
export interface HubApiResponse {
  hubId: string
  name: string
  region: string
  latitude: number
  longitude: number
}

export type GetHubsResponse = HubApiResponse[]

// ─── 차량 API ───────────────────────────────────────────

/**
 * GET /vehicles
 * 전체 차량 목록 조회
 *
 * GET /vehicles/{vehicleId}
 * 단일 차량 상세 조회 (동일 구조)
 */
export interface VehicleApiResponse {
  vehicleId: string
  departureHubId: string
  destinationHubId: string
  status: 'ARRIVED' | 'IN_TRANSIT' | 'DELAYED'
  currentLocation: {
    latitude: number
    longitude: number
  }
  /** 경유 경로 포인트 (출발 → 현재 → 도착) */
  route: VehicleRoutePointApi[]
  /** 현재 주행 중인 도로명 */
  currentRoad: string
  /** 현재 속도 (km/h) */
  speedKmh: number
  /** 목적지까지 남은 거리 (km) */
  remainingDistanceKm: number
  /** 위치 정보 마지막 갱신 시각 (ISO 8601 또는 HH:mm) */
  locationUpdatedAt: string
}

export interface VehicleRoutePointApi {
  latitude: number
  longitude: number
  /** 경유지 이름 (예: "부산 Hub", "현재 위치") */
  label: string
}

export type GetVehiclesResponse = VehicleApiResponse[]
