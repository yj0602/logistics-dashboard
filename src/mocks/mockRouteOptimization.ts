import type { RouteOptimizationInput } from '../types/routeOptimization'

/**
 * 비효율적인 배송 순서를 가진 더미 데이터.
 * 출발지(Stockholm 중심부)에서 가까운 순서가 아닌,
 * 의도적으로 지그재그 경로를 만들어 최적화 전/후 차이를 확인한다.
 *
 * plannedSequence 순서: A(북동) → B(남서) → C(동쪽) → D(남쪽)
 * 효율적 순서 예상: A(북동) → C(동쪽) → D(남쪽) → B(남서) 또는 유사
 */
export const mockRouteOptimizationInput: RouteOptimizationInput = {
  vehicleId: 'VEH-MOCK-001',
  optimizationMode: 'FASTEST',
  startLocation: {
    latitude: 59.3293,
    longitude: 18.0686,
  },
  destinations: [
    {
      destinationId: 'DEST-001',
      name: '배송지 A',
      address: '서울특별시 강남구 역삼동 123-45',
      latitude: 59.3470,
      longitude: 18.0730,
      deadline: '2026-07-10T15:00:00+02:00',
      priority: 2,
      serviceTimeMinutes: 10,
      plannedSequence: 1,
    },
    {
      destinationId: 'DEST-002',
      name: '배송지 B',
      address: '서울특별시 서초구 서초동 678-90',
      latitude: 59.3150,
      longitude: 18.0500,
      deadline: null,
      priority: 1,
      serviceTimeMinutes: 5,
      plannedSequence: 2,
    },
    {
      destinationId: 'DEST-003',
      name: '배송지 C',
      address: '경기도 성남시 분당구 정자동 45-12',
      latitude: 59.3400,
      longitude: 18.1100,
      deadline: '2026-07-10T16:30:00+02:00',
      priority: 3,
      serviceTimeMinutes: 15,
      plannedSequence: 3,
    },
    {
      destinationId: 'DEST-004',
      name: '배송지 D',
      address: '서울특별시 송파구 잠실동 234-56',
      latitude: 59.3000,
      longitude: 18.0900,
      deadline: null,
      priority: 1,
      serviceTimeMinutes: 10,
      plannedSequence: 4,
    },
  ],
}
