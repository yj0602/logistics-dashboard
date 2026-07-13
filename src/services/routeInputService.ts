import type { RouteInputApiResponse } from '../types/routeOptimization'
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

  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.')
  }

  // API 호출
  const url = `${baseUrl}/vehicles/${encodeURIComponent(vehicleId)}/route-input`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    console.error('[RouteInputService] 네트워크 오류:', err)
    throw new Error('경로 입력 데이터 서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.', { cause: err })
  }

  // HTTP 오류 처리
  if (!response.ok) {
    const status = response.status
    if (status === 404) {
      throw new Error(`차량(${vehicleId})의 경로 입력 데이터가 존재하지 않습니다.`)
    }
    console.error('[RouteInputService] API 오류:', status)
    throw new Error(`경로 입력 데이터 조회에 실패했습니다. (HTTP ${status})`)
  }

  // 응답 파싱
  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('API 응답을 파싱할 수 없습니다. 응답 형식을 확인해 주세요.')
  }

  // 기본 구조 확인
  if (!data || typeof data !== 'object') {
    throw new Error('API 응답 구조가 올바르지 않습니다.')
  }

  return data as RouteInputApiResponse
}

/**
 * Mock 모드에서 사용하는 함수.
 * 기존 mock 데이터를 API 응답 형태로 변환하여 반환.
 */
function getMockRouteInput(vehicleId: string): RouteInputApiResponse {
  const mock = mockRouteOptimizationInput

  // mock 데이터를 API 응답 구조로 변환
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
