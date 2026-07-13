// ─── 공통 좌표 ───

export interface LocationPoint {
  latitude: number
  longitude: number
}

// ─── API 응답 타입 (GET /vehicles/{vehicleId}/route-input) ───

export interface RouteInputApiResponse {
  vehicleId: string
  destinationCount: number
  destinations: RouteInputApiDestination[]
}

export interface RouteInputApiDestination {
  destinationId: string
  latitude: number
  longitude: number
  deadline: string | null
}

// ─── 최적화 실행 입력 타입 ───

export interface DestinationData {
  destinationId: string
  latitude: number
  longitude: number
  /** API에서 제공. 없으면 null */
  deadline: string | null
  /** UI 표시용. API에 없으면 undefined */
  name?: string
  /** UI 표시용. API에 없으면 undefined */
  address?: string
  /** 우선순위. API에 없으면 undefined */
  priority?: number
  /** 최적화에서 ServiceDuration 계산에 사용. API에 없으면 undefined → 최적화 시 기본값 적용 */
  serviceTimeMinutes?: number
  /** 원래 배송 순서. API에 없으면 undefined */
  plannedSequence?: number | null
}

export interface RouteOptimizationInput {
  vehicleId: string
  optimizationMode: 'FASTEST' | 'SHORTEST'
  startLocation: LocationPoint
  destinations: DestinationData[]
}

// ─── 최적화 결과 타입 ───

export interface OptimizedWaypoint {
  destinationId: string
  optimizedSequence: number
  originalSequence: number | null
}

export interface RouteOptimizationResult {
  optimizedOrder: OptimizedWaypoint[]
  totalDistanceMeters: number
  totalDurationSeconds: number
}

export interface RouteGeometry {
  coordinates: [number, number][] // [longitude, latitude]
}
