// ===== Chat API Types =====

/**
 * 대기 중인 배송 건 (최적화 모드에서 FM에 전달)
 * deadline을 사용하지 않고, 거리 기반 왕복 시간 vs 유휴 시간 비교만 수행한다.
 */
export interface PendingDelivery {
  id: string
  address: string
  travelMinutes: number
}

// ===== Request Types =====

/**
 * 최적화 모드 요청 — pendingDeliveries가 존재하면 FM이 경로 최적화 분석을 수행
 * 거리 기반의 왕복 시간과 유휴 시간을 비교한다. deadline은 사용하지 않는다.
 */
export interface ChatOptimizationRequest {
  currentTime: string
  lastVehicleEta: string
  confidence: number
  availableMinutes: number
  hubLocation: string
  pendingDeliveries: PendingDelivery[]
}

/**
 * 일반 챗봇 모드 요청 — message만 존재하면 FM이 자유 질의응답 수행
 */
export interface ChatMessageRequest {
  message: string
}

/**
 * POST /chat 요청 본문 — 두 모드의 유니온
 */
export type ChatRequest = ChatOptimizationRequest | ChatMessageRequest

// ===== Response Types =====

/**
 * 실제 API 응답 래퍼 — 두 모드 모두 이 형태로 반환됨
 * response 필드 안의 문자열을 모드에 따라 파싱해야 한다.
 */
export interface ChatRawResponse {
  response: string
}

/**
 * FM 최적화 응답에서 제안하는 배송 옵션
 */
export interface OptimizationOption {
  name: string
  deliveries: string[]
  totalDeliveries: number
  estimatedReturnTime: string
  marginMinutes: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
}

/**
 * FM 최적화 모드 파싱 결과
 */
export interface ChatOptimizationResponse {
  decision: 'RECOMMENDED' | 'CAUTION' | 'NOT_RECOMMENDED'
  options: OptimizationOption[]
  summary: string
  warning: string | null
}

/**
 * 일반 챗봇 모드 응답 (마크다운 텍스트)
 */
export interface ChatMessageResponse {
  answer: string
}
