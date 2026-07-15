import {
  mockAdminAnalysisData,
  mockEmployeeAnalysisData,
} from '../mocks/deliveryAnalysis'
import type { CurrentUser } from '../types/auth'
import type {
  AdminAnalysisData,
  EmployeeAnalysisData,
} from '../types/deliveryAnalysis'
import { getHubs } from './hubService'
import { getVehicles } from './vehicleService'

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * 관리자용 중간 배송 투입 분석 데이터를 조회한다.
 * 현재는 mock 데이터를 반환. 추후 API Gateway로 교체 예정.
 */
export async function getAdminAnalysis(): Promise<AdminAnalysisData> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    ...mockAdminAnalysisData,
    updatedAt: getCurrentTime(),
  }
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
 * HH:mm 형식의 시간까지 남은 분 수를 계산한다.
 * 현재 시각 기준.
 */
function calculateMinutesUntil(timeStr: string): number {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/)
  if (!match) return 0

  const targetHour = parseInt(match[1], 10)
  const targetMin = parseInt(match[2], 10)

  const now = new Date()
  const target = new Date()
  target.setHours(targetHour, targetMin, 0, 0)

  // 대상 시간이 이미 지난 경우 (다음 날로 간주하지 않음)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 0

  return Math.round(diffMs / 60_000)
}
