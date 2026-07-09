import type { Hub } from '../types/hub'

export const mockHubs: Hub[] = [
  {
    hubId: 'HUB-DAEGU',
    name: '대구 Hub',
    region: '대구',
    location: { lat: 35.8714, lng: 128.6014, x: 20, y: 22 },
  },
  {
    hubId: 'HUB-DAEJEON',
    name: '대전 Hub',
    region: '대전',
    location: { lat: 36.3504, lng: 127.3845, x: 18, y: 66 },
  },
  {
    hubId: 'HUB-BUSAN',
    name: '부산 Hub',
    region: '부산',
    location: { lat: 35.1796, lng: 129.0756, x: 51, y: 82 },
  },
  {
    hubId: 'HUB-ULSAN',
    name: '울산 Hub',
    region: '울산',
    location: { lat: 35.5384, lng: 129.3114, x: 78, y: 50 },
  },
]
