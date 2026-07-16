import {
  mockAdminAnalysisData,
  mockEmployeeAnalysisData,
} from '../mocks/deliveryAnalysis'
import type { CurrentUser } from '../types/auth'
import type {
  ChatOptimizationRequest,
  ChatOptimizationResponse,
  PendingDelivery,
} from '../types/chat'
import type {
  AdminAnalysisData,
  AdminAnalysisSummary,
  EmployeeAnalysisData,
  HubOperationRow,
  RealDestination,
  RiskLevel,
} from '../types/deliveryAnalysis'
import type { RouteInputApiDestination } from '../types/routeOptimization'
import { calculateDemoMinutesUntil, getDemoCurrentTime, getDemoIsoTime } from '../utils/demoTime'
import { requestOptimization } from './chatService'
import { getHubs } from './hubService'
import { getVehicleRouteInput } from './routeInputService'
import { getVehicles } from './vehicleService'

function getCurrentTime(): string {
  return getDemoCurrentTime()
}

/**
 * 관리자용 중간 배송 투입 분석 데이터를 조회한다.
 * 실제 API(허브, 간선차량/ETA)를 조합하여 허브별 현황을 계산한다.
 * 직원/배송 상세는 허브 클릭 시 incoming-orders API로 조회한다.
 * AI 요약은 별도 FM 호출로 처리 (AdminDeliveryAnalysis에서 수행).
 */
export async function getAdminAnalysis(): Promise<AdminAnalysisData> {
  try {
    // 1. 허브 목록 + 전체 간선차량 (ETA 포함) 병렬 조회
    const [hubs, allVehicles] = await Promise.all([
      getHubs(),
      getVehicles('ADMIN'),
    ])

    // 2. 허브별 간선차량/ETA 기반 운영 현황 산출
    const hubRows: HubOperationRow[] = []

    for (const hub of hubs) {
      // 이 허브로 향하는 간선차량들 (HVEH)
      const hubVehicles = allVehicles.filter(
        (v) => v.destinationHubId === hub.hubId,
      )

      if (hubVehicles.length === 0) continue

      // 아직 도착하지 않은 간선차량
      const incomingVehicles = hubVehicles.filter((v) => v.status !== 'ARRIVED')
      // 이미 도착한 간선차량
      const arrivedVehicles = hubVehicles.filter((v) => v.status === 'ARRIVED')

      // 도착 예정 간선차량이 없으면 목록에서 제외
      if (incomingVehicles.length === 0) continue

      // 막차 ETA 계산 (가장 늦게 도착하는 간선차량)
      let lastVehicleEta = '-'
      let remainingMinutes = 0

      if (incomingVehicles.length > 0) {
        const lastVehicle = incomingVehicles
          .filter((v) => v.eta.estimatedArrivalTime)
          .sort((a, b) =>
            String(b.eta.estimatedArrivalTime).localeCompare(
              String(a.eta.estimatedArrivalTime),
            ),
          )[0]

        if (lastVehicle?.eta.estimatedArrivalTime) {
          lastVehicleEta = lastVehicle.eta.estimatedArrivalTime
          remainingMinutes = calculateMinutesUntil(lastVehicleEta)
        }
      }

      // 위험도 판정
      const riskLevel = determineRiskLevel(remainingMinutes)

      hubRows.push({
        hubId: hub.hubId,
        hubName: hub.name,
        lastVehicleEta,
        remainingMinutes,
        waitingEmployees: incomingVehicles.length, // 도착 대기 중인 간선차량 수
        availableEmployees: arrivedVehicles.length, // 이미 도착한 간선차량 수
        expectedDeliveries: hubVehicles.length, // 총 간선차량 수 (도착+미도착)
        averageBufferMinutes: Math.max(0, remainingMinutes - 20),
        riskLevel,
      })
    }

    // 3. 전체 요약 집계
    const summary: AdminAnalysisSummary = {
      waitingEmployees: hubRows.reduce((sum, h) => sum + h.waitingEmployees, 0), // 대기 중 간선차량
      availableEmployees: hubRows.reduce((sum, h) => sum + h.availableEmployees, 0), // 도착 완료 차량
      cautionEmployees: hubRows.filter((h) => h.riskLevel === 'MEDIUM').length,
      unavailableEmployees: hubRows.filter((h) => h.riskLevel === 'HIGH').length,
      expectedDeliveries: hubRows.reduce((sum, h) => sum + h.expectedDeliveries, 0),
      averageIdleMinutes: hubRows.length > 0
        ? Math.round(hubRows.reduce((sum, h) => sum + h.remainingMinutes, 0) / hubRows.length)
        : 0,
    }

    return {
      summary,
      aiSummary: {
        content: '',
        generatedAt: getCurrentTime(),
      },
      hubs: hubRows,
      hubDetails: {},
      updatedAt: getCurrentTime(),
    }
  } catch (err) {
    console.warn('[AdminAnalysis] 실제 데이터 조회 실패, mock 데이터 사용:', err)
    return {
      ...mockAdminAnalysisData,
      updatedAt: getCurrentTime(),
    }
  }
}

/**
 * 남은 시간 기반 위험도 판정.
 * - 60분 이상: LOW (안정)
 * - 30~59분: MEDIUM (주의)
 * - 30분 미만: HIGH (위험)
 */
function determineRiskLevel(remainingMinutes: number): RiskLevel {
  if (remainingMinutes >= 60) return 'LOW'
  if (remainingMinutes >= 30) return 'MEDIUM'
  return 'HIGH'
}

/**
 * 직원용 중간 배송 투입 분석 데이터를 조회한다.
 * 로그인한 사용자 정보를 전달받아 situation에 반영한다.
 * 실시간 차량 ETA/상태 정보도 연결한다.
 * 현재는 mock + 실시간 데이터 혼합. 추후 전용 API로 교체 예정.
 */
export async function getEmployeeAnalysis(
  user?: CurrentUser | null,
): Promise<EmployeeAnalysisData> {
  const baseData: EmployeeAnalysisData = {
    ...mockEmployeeAnalysisData,
    situation: { ...mockEmployeeAnalysisData.situation },
    decision: { ...mockEmployeeAnalysisData.decision },
    updatedAt: getCurrentTime(),
  }

  // 로그인 사용자 정보가 있으면 situation에 반영
  if (user) {
    baseData.situation.employeeId = user.employeeId
    baseData.situation.employeeName = user.name
    baseData.situation.assignedVehicleId =
      user.assignedVehicleId ?? baseData.situation.assignedVehicleId

    if (user.hubId) {
      baseData.situation.hubId = user.hubId

      try {
        // 허브 이름 + 차량 데이터 동시 조회
        const [hubs, vehicles] = await Promise.all([
          getHubs(),
          getVehicles('EMPLOYEE', user.hubId),
        ])

        // 허브 이름 설정
        const hub = hubs.find((h) => h.hubId === user.hubId)
        baseData.situation.hubName = hub?.name ?? user.hubId

        // 내 허브로 오는 차량 중 마지막 도착 차량(막차) 정보 연결
        if (vehicles.length > 0) {
          // 아직 도착하지 않은 차량들
          const incomingVehicles = vehicles.filter(
            (v) => v.status !== 'ARRIVED',
          )

          if (incomingVehicles.length > 0) {
            // ETA가 가장 늦은 차량 = 막차
            const lastVehicle = incomingVehicles
              .filter((v) => v.eta.estimatedArrivalTime)
              .sort((a, b) =>
                String(b.eta.estimatedArrivalTime).localeCompare(
                  String(a.eta.estimatedArrivalTime),
                ),
              )[0]

            if (lastVehicle) {
              baseData.situation.vehicleStatus = lastVehicle.status
              baseData.situation.estimatedArrivalTime =
                lastVehicle.eta.estimatedArrivalTime ?? baseData.situation.estimatedArrivalTime
              baseData.situation.delayMinutes = lastVehicle.eta.delayMinutes
              baseData.situation.confidence =
                lastVehicle.eta.confidence ?? baseData.situation.confidence
              baseData.situation.predictionUpdatedAt =
                lastVehicle.eta.predictionUpdatedAt

              // 유휴시간 계산: 막차 도착까지 남은 분
              const etaTime = lastVehicle.eta.estimatedArrivalTime
              if (etaTime) {
                const idleMinutes = calculateMinutesUntil(etaTime)
                if (idleMinutes > 0) {
                  baseData.situation.availableIdleMinutes = idleMinutes
                }
              }

              // decision에도 막차 ETA 반영
              baseData.decision.lastVehicleEta =
                lastVehicle.eta.estimatedArrivalTime ?? baseData.decision.lastVehicleEta
            }
          } else {
            // 모든 차량이 도착한 경우
            baseData.situation.vehicleStatus = 'ARRIVED'
            baseData.situation.delayMinutes = 0
            baseData.situation.availableIdleMinutes = 0
          }
        }
      } catch {
        // API 실패 시 mock 기본값 유지
        baseData.situation.hubName = user.hubId
      }
    }
  }

  return baseData
}

/**
 * HH:mm 형식의 시간까지 데모 현재 시각 기준으로 남은 분 수를 계산한다.
 */
function calculateMinutesUntil(timeStr: string): number {
  return calculateDemoMinutesUntil(timeStr)
}

/**
 * 데모 현재 시각을 ISO 형식으로 반환한다.
 */
function getCurrentIsoTime(): string {
  return getDemoIsoTime()
}

// ===== 거리/이동시간 계산 =====

/**
 * 두 좌표 사이의 직선 거리를 km 단위로 계산한다 (Haversine 공식).
 */
function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * 직선 거리에서 예상 이동시간(분)을 추정한다.
 * 도심 보정 계수 1.4를 적용하고, 평균 시속 30km/h를 가정.
 */
function estimateTravelMinutesFromDistance(distanceKm: number): number {
  const roadFactor = 1.4 // 직선 → 실제 도로 보정
  const avgSpeedKmh = 30 // 도심 평균 속도
  return Math.round((distanceKm * roadFactor / avgSpeedKmh) * 60)
}

// ===== 실제 배송지 조회 =====

/**
 * route-input API에서 실제 배송지를 조회하고, 허브 좌표 기준으로
 * 거리/이동시간을 계산하여 RealDestination[] 형태로 반환한다.
 *
 * @param vehicleId - 배정 차량 ID
 * @param hubLat - 허브 위도
 * @param hubLng - 허브 경도
 * @param signal - AbortSignal (선택)
 */
export async function fetchRealDestinations(
  vehicleId: string,
  hubLat: number,
  hubLng: number,
  signal?: AbortSignal,
): Promise<RealDestination[]> {
  const routeInput = await getVehicleRouteInput(vehicleId, signal)

  if (!routeInput.destinations || routeInput.destinations.length === 0) {
    return []
  }

  return routeInput.destinations.map((d, idx) => {
    const distanceKm = haversineDistanceKm(hubLat, hubLng, d.latitude, d.longitude)
    const travelMinutes = estimateTravelMinutesFromDistance(distanceKm)
    const roundTripMinutes = travelMinutes * 2

    return {
      destinationId: d.destinationId,
      sequence: idx + 1,
      address: d.address ?? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`,
      latitude: d.latitude,
      longitude: d.longitude,
      distanceFromHubKm: Math.round(distanceKm * 10) / 10,
      travelMinutes,
      roundTripMinutes,
    }
  })
}

// ===== FM 최적화 =====

/**
 * route-input API 배송지 목록을 FM PendingDelivery 형식으로 변환한다.
 * deadline을 사용하지 않고 거리 기반 이동시간만 전달한다.
 */
function routeInputToPendingDeliveries(
  destinations: RouteInputApiDestination[],
  hubLat: number,
  hubLng: number,
): PendingDelivery[] {
  return destinations.map((d) => {
    const distanceKm = haversineDistanceKm(hubLat, hubLng, d.latitude, d.longitude)
    const travelMinutes = estimateTravelMinutesFromDistance(distanceKm)

    return {
      id: d.destinationId,
      address: d.address ?? `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}`,
      travelMinutes,
    }
  })
}

/**
 * route-input API에서 실제 배송지를 조회한 후 FM 최적화를 호출한다.
 * 거리 기반의 왕복 시간과 유휴 시간을 비교하여 AI 판단을 받는다.
 * deadline은 사용하지 않는다.
 *
 * @param situation - 현재 직원 상황 데이터
 * @param vehicleId - 배정 차량 ID (route-input 조회용)
 * @param hubLat - 허브 위도
 * @param hubLng - 허브 경도
 * @param signal - AbortSignal (선택)
 * @returns FM 최적화 응답 또는 null (실패 시)
 */
export async function requestAutoOptimization(
  situation: EmployeeAnalysisData['situation'],
  vehicleId: string,
  hubLat: number,
  hubLng: number,
  signal?: AbortSignal,
): Promise<ChatOptimizationResponse | null> {
  // 1. route-input API에서 실제 배송지 조회
  const routeInput = await getVehicleRouteInput(vehicleId, signal)

  if (!routeInput.destinations || routeInput.destinations.length === 0) {
    return null
  }

  // FM에는 최대 10건만 전달 (토큰 한도 고려)
  const limitedDestinations = routeInput.destinations.slice(0, 10)

  // 2. FM 요청 페이로드 구성 (deadline 없이, 거리 기반 이동시간만)
  const payload: ChatOptimizationRequest = {
    currentTime: getCurrentIsoTime(),
    lastVehicleEta: situation.estimatedArrivalTime,
    confidence: Math.round(
      typeof situation.confidence === 'number' && situation.confidence <= 1
        ? situation.confidence * 100
        : situation.confidence,
    ),
    availableMinutes: situation.availableIdleMinutes,
    hubLocation: situation.hubName,
    pendingDeliveries: routeInputToPendingDeliveries(limitedDestinations, hubLat, hubLng),
  }

  // 3. FM Chat API 호출
  try {
    return await requestOptimization(payload, { signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    console.warn('[DeliveryAnalysis] FM 자동 최적화 요청 실패:', err)
    return null
  }
}
