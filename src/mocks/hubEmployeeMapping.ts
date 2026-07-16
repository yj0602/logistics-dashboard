/**
 * 데모용 허브-직원 매핑 설정.
 *
 * 현재 DB에서 직원이 할당된 허브는 5개뿐이고,
 * 차량 API가 반환하는 도착 허브는 40개입니다.
 * 직원이 없는 허브에서 "직원 조회"를 했을 때 근처 직원 보유 허브의
 * 직원을 참조할 수 있도록 매핑합니다.
 *
 * 실제 운영 시에는 DB에서 직원-허브 할당이 정합성 있게 관리되므로
 * 이 매핑은 제거하면 됩니다.
 */

/** 직원이 실제 할당된 허브 목록 */
export const EMPLOYEE_ASSIGNED_HUBS = [
  'HUB078',
  'HUB056',
  'HUB099',
  'HUB074',
  'HUB084',
] as const

/**
 * 도착 허브 → 직원 보유 허브 매핑.
 * 직원이 직접 할당된 허브는 자기 자신으로 매핑.
 * 직원이 없는 허브는 null (매핑 없음).
 */
export function getEmployeeMappedHubId(hubId: string): string | null {
  if (EMPLOYEE_ASSIGNED_HUBS.includes(hubId as typeof EMPLOYEE_ASSIGNED_HUBS[number])) {
    return hubId
  }
  return null
}

/**
 * 특정 허브에 직원이 할당되어 있는지 확인.
 */
export function hasAssignedEmployees(hubId: string): boolean {
  return EMPLOYEE_ASSIGNED_HUBS.includes(hubId as typeof EMPLOYEE_ASSIGNED_HUBS[number])
}
