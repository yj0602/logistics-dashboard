export type UserRole = 'ADMIN' | 'EMPLOYEE'

export interface CurrentUser {
  employeeId: string
  name: string
  role: UserRole
  hubId?: string
}
