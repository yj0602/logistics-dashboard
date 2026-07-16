/**
 * 백엔드 API 응답 타입 정의
 *
 * 프론트 내부 타입(Hub, Vehicle 등)과 분리하여 관리한다.
 * API 응답 → 프론트 타입 변환은 서비스 계층 또는 mapper에서 수행.
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


// ─── ETA 예측 API (AI Agent) ────────────────────────────

/**
 * GET /vehicles/eta
 * 전체 차량 ETA 일괄 조회 (AI 예측 결과)
 *
 * Endpoint: https://7c9ge0cd58.execute-api.ap-northeast-2.amazonaws.com/prod/vehicles/eta
 */
export interface EtaPredictionApiResponse {
  vehicleId: string
  /** ISO 8601 형식 예상 도착 시간. 도착 완료/예측 불가 시 null */
  estimatedArrivalTime: string | null
  /** 예정 시간 대비 지연 분 수 */
  delayMinutes: number
  /** 예측 모델이 마지막으로 결과를 갱신한 시간 (ISO 8601) */
  predictionUpdatedAt: string
  /** AI 예측 기반 차량 상태 (차량 위치 API와 별도로 지연 여부를 판단) */
  status?: 'ARRIVED' | 'IN_TRANSIT' | 'DELAYED'
  /** 예측 신뢰도 (0.0~1.0) */
  confidence?: number
}

export interface GetEtaPredictionsResponse {
  predictions: EtaPredictionApiResponse[]
}


// ─── 배송기사 주문/간선차량 API ────────────────────────────

/**
 * GET /employees/{employeeId}/incoming-orders
 * 기사에게 배정된 배송 주문 및 각 주문이 적재된 간선차량 조회
 */
export interface IncomingOrdersApiResponse {
  employeeId: string
  name: string
  role: 'DRIVER' | 'ADMIN'
  hubId: string
  assignedVehicleId: string | null
  orderCount: number
  orders: IncomingOrderApi[]
}

export interface IncomingOrderApi {
  orderId: string
  deliveryAddress: string
  latitude: number
  longitude: number
  deadline: string
  deliveryVehicleId: string
  lineHaulVehicle: LineHaulVehicleApi
}

export interface LineHaulVehicleApi {
  vehicleId: string
  status: 'IN_TRANSIT' | 'ARRIVED'
  departureHubId: string
  destinationHubId: string
  currentLocation: {
    latitude: number
    longitude: number
  }
  currentRoad: string
  speedKmh: number
  remainingDistanceKm: number
  locationUpdatedAt: string
}
