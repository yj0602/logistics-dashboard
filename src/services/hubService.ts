import { apiGet } from './apiClient'
import { mockHubs } from '../mocks/hubs'
import type { Hub } from '../types/hub'
import type { HubApiResponse } from '../types/api'

/**
 * API 응답을 프론트 Hub 타입으로 변환.
 * API에는 x, y 좌표가 없으므로 0으로 설정한다 (지도 표시 시 lat/lng 사용).
 */
function mapHubResponse(apiHub: HubApiResponse): Hub {
  return {
    hubId: apiHub.hubId,
    name: apiHub.name,
    region: apiHub.region,
    location: {
      lat: apiHub.latitude,
      lng: apiHub.longitude,
      x: 0,
      y: 0,
    },
  }
}

/**
 * 전체 허브 목록을 조회한다.
 * API 호출 실패 시 mock 데이터로 fallback.
 */
export async function getHubs(): Promise<Hub[]> {
  try {
    const response = await apiGet<HubApiResponse[]>('/hubs')
    return response.map(mapHubResponse)
  } catch (err) {
    console.warn('[HubService] API 호출 실패, mock 데이터 사용:', err)
    return mockHubs
  }
}
