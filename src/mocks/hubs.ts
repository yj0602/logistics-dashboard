import type { Hub } from '../types/hub'

/**
 * Mock 허브 목록 (API fallback 용).
 * 실제 API: GET /hubs → HUBxxx 형식의 ID 반환.
 * mock은 주요 허브만 포함한다.
 */
export const mockHubs: Hub[] = [
  {
    hubId: 'HUB001',
    name: '울산 Hub 1',
    region: '울산',
    location: { lat: 35.490901, lng: 129.288903, x: 0, y: 0 },
  },
  {
    hubId: 'HUB004',
    name: '부산 Hub',
    region: '부산',
    location: { lat: 35.1796, lng: 129.0756, x: 0, y: 0 },
  },
  {
    hubId: 'HUB018',
    name: '대구 Hub',
    region: '대구',
    location: { lat: 35.8714, lng: 128.6014, x: 0, y: 0 },
  },
  {
    hubId: 'HUB032',
    name: '대전 Hub',
    region: '대전',
    location: { lat: 36.3504, lng: 127.3845, x: 0, y: 0 },
  },
  {
    hubId: 'HUB056',
    name: '양산 Hub',
    region: '양산',
    location: { lat: 35.3350, lng: 129.0370, x: 0, y: 0 },
  },
]
