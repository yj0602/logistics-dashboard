import type { RouteInputApiResponse } from '../types/routeOptimization'
import { apiGet } from './apiClient'
import { mockRouteOptimizationInput } from '../mocks/mockRouteOptimization'

/**
 * GET /vehicles/{vehicleId}/route-input API 호출
 *
 * 환경 변수 VITE_USE_MOCK_ROUTE_INPUT=true이면 mock 데이터를 반환한다.
 * 기본값은 실제 API 호출이다.
 */
export async function getVehicleRouteInput(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<RouteInputApiResponse> {
  // Mock 모드
  if (import.meta.env.VITE_USE_MOCK_ROUTE_INPUT === 'true') {
    return getMockRouteInput(vehicleId)
  }

  // 입력 검증
  if (!vehicleId.trim()) {
    throw new Error('차량 ID가 필요합니다.')
  }

  // API 호출 (공통 apiGet 사용)
  const path = `/vehicles/${encodeURIComponent(vehicleId)}/route-input`
  const data = await apiGet<RouteInputApiResponse>(path, { signal })

  // 기본 구조 확인
  if (!data || typeof data !== 'object') {
    throw new Error('API 응답 구조가 올바르지 않습니다.')
  }

  return data
}

/**
 * Mock 모드에서 사용하는 함수.
 * 기존 mock 데이터를 API 응답 형태로 변환하여 반환.
 */
function getMockRouteInput(vehicleId: string): RouteInputApiResponse {
  const mock = mockRouteOptimizationInput

  return {
    vehicleId: vehicleId,
    destinationCount: mock.destinations.length,
    destinations: mock.destinations.map((d) => ({
      destinationId: d.destinationId,
      latitude: d.latitude,
      longitude: d.longitude,
      deadline: d.deadline ?? null,
    })),
  }
}
