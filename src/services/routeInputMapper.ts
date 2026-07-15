import type {
  RouteInputApiResponse,
  RouteOptimizationInput,
  DestinationData,
  LocationPoint,
} from '../types/routeOptimization'
import type { Hub } from '../types/hub'
import type { Vehicle } from '../types/vehicle'

// ─── 좌표 검증 ───

function isValidLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90
}

function isValidLongitude(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

// ─── 출발 허브 조회 ───

/**
 * vehicleId에 연결된 출발 허브의 좌표를 조회한다.
 * 차량 목록에서 departureHubId를 찾고, 허브 목록에서 해당 좌표를 반환.
 *
 * @throws 차량을 찾을 수 없거나 허브를 찾을 수 없으면 에러
 */
export function resolveDepartureHubLocation(
  vehicleId: string,
  vehicles: Vehicle[],
  hubs: Hub[],
): LocationPoint {
  const vehicle = vehicles.find((v) => v.vehicleId === vehicleId)
  if (!vehicle) {
    throw new Error(
      '차량의 출발 허브 정보를 찾을 수 없어 경로 최적화를 실행할 수 없습니다.',
    )
  }

  const hub = hubs.find((h) => h.hubId === vehicle.departureHubId)
  if (!hub) {
    throw new Error(
      `차량(${vehicleId})의 출발 허브(${vehicle.departureHubId})를 찾을 수 없어 경로 최적화를 실행할 수 없습니다.`,
    )
  }

  const location: LocationPoint = {
    latitude: hub.location.lat,
    longitude: hub.location.lng,
  }

  if (!isValidCoordinate(location.latitude, location.longitude)) {
    throw new Error(
      `출발 허브(${hub.hubId})의 좌표가 유효하지 않습니다.`,
    )
  }

  return location
}

// ─── API 응답 검증 ───

/**
 * API 응답의 기본 구조와 배송지 좌표를 검증한다.
 * @throws 검증 실패 시 사용자 메시지와 함께 에러
 */
export function validateRouteInputResponse(response: RouteInputApiResponse): void {
  if (!response.vehicleId) {
    throw new Error('API 응답에 vehicleId가 없습니다.')
  }

  if (!Array.isArray(response.destinations)) {
    throw new Error('API 응답의 destinations가 배열이 아닙니다.')
  }

  if (response.destinations.length === 0) {
    throw new Error('배송지 목록이 비어 있습니다.')
  }

  const invalidDestinations = response.destinations.filter(
    (d) => !isValidCoordinate(d.latitude, d.longitude),
  )

  if (invalidDestinations.length > 0) {
    const invalidIds = invalidDestinations.map((d) => d.destinationId).join(', ')
    throw new Error(
      `유효하지 않은 좌표를 가진 배송지가 있습니다: ${invalidIds}`,
    )
  }
}

// ─── Mapper ───

export interface MapRouteInputOptions {
  /** 출발 허브 좌표 (resolveDepartureHubLocation으로 조회) */
  startLocation: LocationPoint
  /** 최적화 모드. UI 선택값이 없으면 기본값 FASTEST */
  optimizationMode?: 'FASTEST' | 'SHORTEST'
}

/**
 * API 응답을 최적화 실행 입력 타입으로 변환한다.
 *
 * - API가 제공하는 필드(destinationId, latitude, longitude, deadline)는 그대로 사용
 * - API에 없는 필드(name, address, priority, serviceTimeMinutes, plannedSequence)는 설정하지 않음 (optional)
 * - startLocation은 외부에서 허브 좌표를 조회하여 전달해야 함
 * - optimizationMode는 프론트 실행 옵션으로 취급
 */
export function mapRouteInputResponse(
  response: RouteInputApiResponse,
  options: MapRouteInputOptions,
): RouteOptimizationInput {
  validateRouteInputResponse(response)

  const destinations: DestinationData[] = response.destinations.map((apiDest) => ({
    destinationId: apiDest.destinationId,
    latitude: apiDest.latitude,
    longitude: apiDest.longitude,
    deadline: apiDest.deadline,
    // API에서 주소가 제공되면 그대로 전달
    address: apiDest.address,
  }))

  return {
    vehicleId: response.vehicleId,
    optimizationMode: options.optimizationMode ?? 'FASTEST',
    startLocation: options.startLocation,
    destinations,
  }
}
