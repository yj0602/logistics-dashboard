import {
  mockAdminAnalysisData,
  mockEmployeeAnalysisData,
} from '../mocks/deliveryAnalysis'
import type {
  AdminAnalysisData,
  EmployeeAnalysisData,
} from '../types/deliveryAnalysis'

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
 * 현재는 mock 데이터를 반환. 추후 API Gateway로 교체 예정.
 */
export async function getEmployeeAnalysis(): Promise<EmployeeAnalysisData> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    ...mockEmployeeAnalysisData,
    updatedAt: getCurrentTime(),
  }
}
