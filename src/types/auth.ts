export type UserRole = 'ADMIN' | 'EMPLOYEE'

/**
 * API에서 반환되는 직원 role 값.
 * 프론트에서는 DRIVER → EMPLOYEE로 매핑하여 사용한다.
 */
export type ApiEmployeeRole = 'ADMIN' | 'DRIVER'

export interface CurrentUser {
  employeeId: string
  name: string
  role: UserRole
  hubId?: string
  /** 배송기사(DRIVER)에게 배정된 배송차량 ID. 관리자는 null */
  assignedVehicleId?: string | null
}

/**
 * GET /employees/{employeeId} API 응답 타입
 */
export interface EmployeeApiResponse {
  employeeId: string
  name: string
  role: ApiEmployeeRole
  hubId: string
  assignedVehicleId: string | null
}

/**
 * API role → 프론트 UserRole 매핑
 */
export function mapApiRoleToUserRole(apiRole: ApiEmployeeRole): UserRole {
  return apiRole === 'DRIVER' ? 'EMPLOYEE' : 'ADMIN'
}
