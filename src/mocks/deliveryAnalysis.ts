import type {
  AdminAnalysisData,
  AiQaPair,
  Destination,
  DeliveryOption,
  EmployeeAnalysisData,
  HubDetail,
  HubOperationRow,
} from '../types/deliveryAnalysis'

// ===== Admin Mock Data =====

const mockHubOperations: HubOperationRow[] = [
  {
    hubId: 'HUB056',
    hubName: '부산 Hub 56',
    lastVehicleEta: '21:40',
    remainingMinutes: 68,
    waitingEmployees: 13,
    availableEmployees: 9,
    expectedDeliveries: 18,
    averageBufferMinutes: 26,
    riskLevel: 'LOW',
  },
  {
    hubId: 'HUB074',
    hubName: '양산 Hub 74',
    lastVehicleEta: '21:18',
    remainingMinutes: 46,
    waitingEmployees: 6,
    availableEmployees: 4,
    expectedDeliveries: 8,
    averageBufferMinutes: 8,
    riskLevel: 'HIGH',
  },
  {
    hubId: 'HUB078',
    hubName: '김해 Hub 78',
    lastVehicleEta: '22:05',
    remainingMinutes: 93,
    waitingEmployees: 11,
    availableEmployees: 8,
    expectedDeliveries: 14,
    averageBufferMinutes: 21,
    riskLevel: 'MEDIUM',
  },
  {
    hubId: 'HUB084',
    hubName: '김해 Hub 84',
    lastVehicleEta: '21:52',
    remainingMinutes: 80,
    waitingEmployees: 10,
    availableEmployees: 7,
    expectedDeliveries: 12,
    averageBufferMinutes: 18,
    riskLevel: 'LOW',
  },
  {
    hubId: 'HUB099',
    hubName: '양산 Hub 99',
    lastVehicleEta: '21:30',
    remainingMinutes: 58,
    waitingEmployees: 10,
    availableEmployees: 6,
    expectedDeliveries: 10,
    averageBufferMinutes: 14,
    riskLevel: 'MEDIUM',
  },
]

/**
 * 허브별 상세 정보 (mock fallback용).
 * 실제로는 관리자가 상세 보기 시 getEmployeesByHubId()로 API 조회.
 * 이 데이터는 API 실패 시에만 사용된다.
 */
const mockHubDetails: Record<string, HubDetail> = {
  'HUB056': {
    hubId: 'HUB056',
    hubName: '부산 Hub 56',
    lastVehicleEta: '21:40',
    waitingEmployees: 13,
    employees: [
      { employeeId: 'DRV008', employeeName: '기사 008', status: 'AVAILABLE', recommendedArea: '사하구', estimatedReturnTime: '21:14', bufferMinutes: 26 },
      { employeeId: 'DRV011', employeeName: '기사 011', status: 'AVAILABLE', recommendedArea: '연제구', estimatedReturnTime: '21:08', bufferMinutes: 32 },
      { employeeId: 'DRV016', employeeName: '기사 016', status: 'CAUTION', recommendedArea: '동래구', estimatedReturnTime: '21:31', bufferMinutes: 9 },
    ],
    expectedDeliveries: 18,
    riskFactors: ['교통 혼잡 시간대 접근 중', '일부 배송지 마감시간 임박'],
  },
  'HUB074': {
    hubId: 'HUB074',
    hubName: '양산 Hub 74',
    lastVehicleEta: '21:18',
    waitingEmployees: 6,
    employees: [
      { employeeId: 'DRV005', employeeName: '기사 005', status: 'CAUTION', recommendedArea: '물금읍', estimatedReturnTime: '21:12', bufferMinutes: 6 },
      { employeeId: 'DRV012', employeeName: '기사 012', status: 'AVAILABLE', recommendedArea: '양산시 중앙동', estimatedReturnTime: '21:05', bufferMinutes: 13 },
    ],
    expectedDeliveries: 8,
    riskFactors: ['막차 도착까지 여유시간 부족', '복귀 지연 시 하차 작업 인력 부족 우려'],
  },
  'HUB078': {
    hubId: 'HUB078',
    hubName: '김해 Hub 78',
    lastVehicleEta: '22:05',
    waitingEmployees: 11,
    employees: [
      { employeeId: 'DRV002', employeeName: '기사 002', status: 'AVAILABLE', recommendedArea: '삼계동', estimatedReturnTime: '21:38', bufferMinutes: 27 },
      { employeeId: 'DRV003', employeeName: '기사 003', status: 'AVAILABLE', recommendedArea: '내외동', estimatedReturnTime: '21:44', bufferMinutes: 21 },
      { employeeId: 'DRV004', employeeName: '기사 004', status: 'CAUTION', recommendedArea: '장유동', estimatedReturnTime: '21:56', bufferMinutes: 9 },
    ],
    expectedDeliveries: 14,
    riskFactors: ['일부 구간 도로 공사 진행 중'],
  },
  'HUB084': {
    hubId: 'HUB084',
    hubName: '김해 Hub 84',
    lastVehicleEta: '21:52',
    waitingEmployees: 10,
    employees: [
      { employeeId: 'DRV001', employeeName: '기사 001', status: 'AVAILABLE', recommendedArea: '진영읍', estimatedReturnTime: '21:30', bufferMinutes: 22 },
      { employeeId: 'DRV015', employeeName: '기사 015', status: 'AVAILABLE', recommendedArea: '주촌면', estimatedReturnTime: '21:35', bufferMinutes: 17 },
    ],
    expectedDeliveries: 12,
    riskFactors: [],
  },
  'HUB099': {
    hubId: 'HUB099',
    hubName: '양산 Hub 99',
    lastVehicleEta: '21:30',
    waitingEmployees: 10,
    employees: [
      { employeeId: 'DRV007', employeeName: '기사 007', status: 'AVAILABLE', recommendedArea: '웅상읍', estimatedReturnTime: '21:08', bufferMinutes: 22 },
      { employeeId: 'DRV009', employeeName: '기사 009', status: 'CAUTION', recommendedArea: '덕계동', estimatedReturnTime: '21:22', bufferMinutes: 8 },
    ],
    expectedDeliveries: 10,
    riskFactors: ['일부 기사 복귀 시간 여유 부족'],
  },
}

export const mockAdminAnalysisData: AdminAnalysisData = {
  summary: {
    waitingEmployees: 50,
    availableEmployees: 34,
    cautionEmployees: 10,
    unavailableEmployees: 6,
    expectedDeliveries: 62,
    averageIdleMinutes: 42,
  },
  aiSummary: {
    content:
      '현재 부산 Hub 56은 막차 도착까지 약 68분 남아 있어 대기 직원 13명 중 9명을 중간 배송에 투입할 수 있습니다. 양산 Hub 74는 복귀 여유시간이 짧아 신규 투입에 주의가 필요합니다. 김해 Hub 78은 여유시간이 충분하여 8명 투입이 가능하나, 일부 구간 도로 공사로 이동시간 증가에 유의해야 합니다.',
    generatedAt: '20:32',
  },
  hubs: mockHubOperations,
  hubDetails: mockHubDetails,
  updatedAt: '20:32',
}

// ===== Employee Mock Data =====

const mockDeliveryOptions: DeliveryOption[] = [
  {
    optionId: 'OPTION-A',
    title: '안전 우선',
    description: '복귀 여유시간을 가장 많이 확보하는 경로',
    destinationCount: 2,
    totalDistanceKm: 7.2,
    travelMinutes: 27,
    serviceMinutes: 12,
    totalDurationMinutes: 39,
    estimatedReturnTime: '21:14',
    bufferMinutes: 28,
    riskLevel: 'LOW',
    recommended: true,
  },
  {
    optionId: 'OPTION-B',
    title: '처리량 우선',
    description: '복귀 전 가장 많은 배송을 처리하는 경로',
    destinationCount: 4,
    totalDistanceKm: 12.8,
    travelMinutes: 39,
    serviceMinutes: 17,
    totalDurationMinutes: 56,
    estimatedReturnTime: '21:31',
    bufferMinutes: 11,
    riskLevel: 'MEDIUM',
    recommended: false,
  },
  {
    optionId: 'OPTION-C',
    title: '긴급 배송 우선',
    description: '마감 시간이 임박한 배송지를 먼저 처리하는 경로',
    destinationCount: 2,
    totalDistanceKm: 9.4,
    travelMinutes: 34,
    serviceMinutes: 16,
    totalDurationMinutes: 50,
    estimatedReturnTime: '21:25',
    bufferMinutes: 17,
    riskLevel: 'LOW',
    recommended: false,
  },
]

const mockDestinations: Record<string, Destination[]> = {
  'OPTION-A': [
    {
      destinationId: 'DEST-001',
      sequence: 1,
      name: '연산 센트럴 아파트',
      address: '부산광역시 연제구 연산동',
      distanceFromHubKm: 2.8,
      travelMinutes: 9,
      serviceMinutes: 6,
      deadline: '21:10',
      priority: 1,
      status: 'URGENT',
    },
    {
      destinationId: 'DEST-002',
      sequence: 2,
      name: '연산 비즈니스 센터',
      address: '부산광역시 연제구 중앙대로',
      distanceFromHubKm: 4.4,
      travelMinutes: 11,
      serviceMinutes: 6,
      deadline: '21:30',
      priority: 2,
      status: 'NORMAL',
    },
  ],
  'OPTION-B': [
    {
      destinationId: 'DEST-001',
      sequence: 1,
      name: '연산 센트럴 아파트',
      address: '부산광역시 연제구 연산동',
      distanceFromHubKm: 2.8,
      travelMinutes: 9,
      serviceMinutes: 6,
      deadline: '21:10',
      priority: 1,
      status: 'URGENT',
    },
    {
      destinationId: 'DEST-003',
      sequence: 2,
      name: '부전 메디컬타워',
      address: '부산광역시 부산진구 부전동',
      distanceFromHubKm: 5.1,
      travelMinutes: 8,
      serviceMinutes: 4,
      deadline: '21:40',
      priority: 3,
      status: 'NORMAL',
    },
    {
      destinationId: 'DEST-004',
      sequence: 3,
      name: '서면 롯데마트',
      address: '부산광역시 부산진구 부전동',
      distanceFromHubKm: 5.8,
      travelMinutes: 5,
      serviceMinutes: 3,
      deadline: '21:45',
      priority: 3,
      status: 'NORMAL',
    },
    {
      destinationId: 'DEST-002',
      sequence: 4,
      name: '연산 비즈니스 센터',
      address: '부산광역시 연제구 중앙대로',
      distanceFromHubKm: 4.4,
      travelMinutes: 11,
      serviceMinutes: 4,
      deadline: '21:30',
      priority: 2,
      status: 'NORMAL',
    },
  ],
  'OPTION-C': [
    {
      destinationId: 'DEST-005',
      sequence: 1,
      name: '동래 온천 빌라',
      address: '부산광역시 동래구 온천동',
      distanceFromHubKm: 3.9,
      travelMinutes: 14,
      serviceMinutes: 8,
      deadline: '20:50',
      priority: 1,
      status: 'URGENT',
    },
    {
      destinationId: 'DEST-001',
      sequence: 2,
      name: '연산 센트럴 아파트',
      address: '부산광역시 연제구 연산동',
      distanceFromHubKm: 2.8,
      travelMinutes: 12,
      serviceMinutes: 8,
      deadline: '21:10',
      priority: 1,
      status: 'URGENT',
    },
  ],
}

const mockAiQa: AiQaPair[] = [
  {
    question: '왜 이 경로가 추천됐나요?',
    answer:
      '안전 우선 경로는 현재 교통 상황과 막차 ETA를 고려했을 때 복귀 여유시간이 28분으로 가장 넉넉합니다. ETA 예측 신뢰도(87%)를 감안해도 안전하게 복귀할 수 있는 경로입니다.',
  },
  {
    question: '배송지 한 곳을 더 추가할 수 있나요?',
    answer:
      '배송지 한 곳을 추가하면 예상 복귀시간은 21:32이며 막차 도착까지 여유시간은 10분으로 줄어듭니다. 현재 교통 변동성을 고려하면 추가 배송은 권장하지 않습니다.',
  },
  {
    question: '막차 ETA가 10분 당겨지면 어떻게 되나요?',
    answer:
      '막차 ETA가 21:32로 당겨지면 안전 우선 경로의 여유시간이 18분으로 줄어듭니다. 여전히 안전 범위 내이지만, 처리량 우선 경로는 복귀가 어려워져 권장하지 않습니다.',
  },
  {
    question: '가장 안전한 복귀 시간은 언제인가요?',
    answer:
      '현재 막차 ETA(21:42)와 교통 변동성을 고려하면, 21:20 이전에 허브로 복귀하는 것이 가장 안전합니다. 이는 약 22분의 여유를 확보하는 시간입니다.',
  },
]

export const mockEmployeeAnalysisData: EmployeeAnalysisData = {
  situation: {
    employeeId: 'DRV008',
    employeeName: '기사 008',
    hubId: 'HUB056',
    hubName: '부산 Hub 56',
    assignedVehicleId: 'VEH058',
    vehicleStatus: 'DELAYED',
    estimatedArrivalTime: '21:42',
    delayMinutes: 14,
    confidence: 0.87,
    predictionUpdatedAt: '20:35',
    availableIdleMinutes: 67,
  },
  decision: {
    decision: 'RECOMMENDED',
    title: '중간 배송 투입 가능',
    summary:
      '현재 추천 경로를 이용하면 막차 도착 약 28분 전에 허브로 복귀할 수 있습니다.',
    recommendedOptionId: 'OPTION-A',
    estimatedReturnTime: '21:14',
    lastVehicleEta: '21:42',
    bufferMinutes: 28,
    riskLevel: 'LOW',
    warning: '막차 ETA가 10분 이상 앞당겨지면 즉시 복귀해야 합니다.',
  },
  options: mockDeliveryOptions,
  destinations: mockDestinations,
  aiQa: mockAiQa,
  defaultAnswer:
    '현재는 UI 확인을 위한 목업 분석입니다. 선택한 경로와 막차 ETA를 기준으로 실제 AI 연동 시 상세 답변을 제공합니다.',
  updatedAt: '20:35',
}
