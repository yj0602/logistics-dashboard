/**
 * 데모 환경 시간 설정
 *
 * 데모 데이터는 특정 시점을 기준으로 생성되어 있으므로,
 * 실제 브라우저 시각 대신 고정된 데모 시각을 사용한다.
 *
 * 실제 운영 전환 시 이 파일의 함수들을 new Date() 기반으로 변경하면 된다.
 */

/** 데모 기준 시각 (HH:mm) */
export const DEMO_CURRENT_TIME = '08:30'

/** 간선차량 도착 마감 시각 */
export const DEMO_DEADLINE_TIME = '11:00'

const [DEMO_HOUR, DEMO_MIN] = DEMO_CURRENT_TIME.split(':').map(Number)

/**
 * 데모 기준 "현재 시각"을 HH:mm 형식으로 반환한다.
 */
export function getDemoCurrentTime(): string {
  return DEMO_CURRENT_TIME
}

/**
 * 데모 기준 "현재 시각"을 ISO 형식으로 반환한다.
 * FM Chat API의 currentTime 필드에 사용.
 */
export function getDemoIsoTime(): string {
  return `2026-07-15T${DEMO_CURRENT_TIME}:00`
}

/**
 * HH:mm 형식의 시간까지 데모 현재 시각 기준으로 남은 분 수를 계산한다.
 * targetTime이 데모 현재 시각보다 이전이면 0을 반환한다.
 */
export function calculateDemoMinutesUntil(timeStr: string): number {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/)
  if (!match) return 0

  const targetHour = parseInt(match[1], 10)
  const targetMin = parseInt(match[2], 10)

  const targetTotalMin = targetHour * 60 + targetMin
  const currentTotalMin = DEMO_HOUR * 60 + DEMO_MIN

  const diff = targetTotalMin - currentTotalMin
  return diff > 0 ? diff : 0
}
