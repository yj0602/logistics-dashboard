import { apiGet } from './apiClient'
import type { CurrentUser, EmployeeApiResponse } from '../types/auth'
import { mapApiRoleToUserRole } from '../types/auth'

/**
 * API 응답을 프론트 CurrentUser 타입으로 변환한다.
 * API role (ADMIN | DRIVER) → 프론트 UserRole (ADMIN | EMPLOYEE)
 */
function mapEmployeeResponse(apiEmployee: EmployeeApiResponse): CurrentUser {
  return {
    employeeId: apiEmployee.employeeId,
    name: apiEmployee.name,
    role: mapApiRoleToUserRole(apiEmployee.role),
    hubId: apiEmployee.hubId,
    assignedVehicleId: apiEmployee.assignedVehicleId,
  }
}

/**
 * 직원 정보를 조회한다.
 * GET /employees/{employeeId}
 *
 * 데모에서는 로그인 대신 employeeId를 직접 입력받아 호출한다.
 * 향후 관리자가 허브 상세에서 직원 현황을 조회할 때도 활용 예정.
 */
export async function getEmployee(employeeId: string): Promise<CurrentUser> {
  if (!employeeId.trim()) {
    throw new Error('직원 ID를 입력해 주세요.')
  }

  const data = await apiGet<EmployeeApiResponse>(
    `/employees/${encodeURIComponent(employeeId)}`,
  )

  if (!data || !data.employeeId) {
    throw new Error('직원 정보를 찾을 수 없습니다.')
  }

  return mapEmployeeResponse(data)
}

/**
 * 특정 허브에 소속된 배송기사 목록을 조회한다.
 * 현재는 "허브별 직원 목록" API가 없으므로 DRV001~DRV050을 순회하여 필터링.
 * 결과를 캐시하여 중복 호출을 방지한다.
 * 향후 GET /hubs/{hubId}/employees 같은 API가 추가되면 교체.
 */
let employeeCache: CurrentUser[] | null = null

export async function getEmployeesByHubId(hubId: string): Promise<CurrentUser[]> {
  if (!employeeCache) {
    // 전체 기사 목록을 한 번 로드
    const allEmployees: CurrentUser[] = []
    const fetchPromises: Promise<void>[] = []

    for (let i = 1; i <= 50; i++) {
      const id = `DRV${String(i).padStart(3, '0')}`
      fetchPromises.push(
        getEmployee(id)
          .then((emp) => { allEmployees.push(emp) })
          .catch(() => { /* 존재하지 않는 ID는 무시 */ }),
      )
    }

    await Promise.all(fetchPromises)
    employeeCache = allEmployees
  }

  return employeeCache.filter((emp) => emp.hubId === hubId)
}

/**
 * 캐시를 초기화한다. (테스트나 데이터 갱신 시 사용)
 */
export function clearEmployeeCache(): void {
  employeeCache = null
}
