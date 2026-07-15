import { apiGet } from './apiClient'
import type { CurrentUser, EmployeeApiResponse } from '../types/auth'
import { mapApiRoleToUserRole } from '../types/auth'
import type { IncomingOrdersApiResponse } from '../types/api'

const DIRECT_API_BASE = 'https://bkg2eoa1fl.execute-api.ap-northeast-2.amazonaws.com'

/**
 * API 응답을 프론트 CurrentUser 타입으로 변환한다.
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
 * 직원 정보를 조회한다 (프록시 경유).
 * GET /employees/{employeeId}
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
 * 직원 정보를 직접 API URL로 조회한다 (Vite 프록시 우회).
 * 대량 배치 조회 시 프록시 병목을 방지하기 위해 사용.
 */
async function getEmployeeDirect(employeeId: string): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${DIRECT_API_BASE}/employees/${employeeId}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data: EmployeeApiResponse = await response.json()
    if (!data?.employeeId) return null
    return mapEmployeeResponse(data)
  } catch {
    return null
  }
}

/**
 * 기사에게 배정된 배송 주문 및 간선차량 정보를 조회한다.
 * GET /employees/{employeeId}/incoming-orders
 */
export async function getIncomingOrders(
  employeeId: string,
): Promise<IncomingOrdersApiResponse> {
  const data = await apiGet<IncomingOrdersApiResponse>(
    `/employees/${encodeURIComponent(employeeId)}/incoming-orders`,
  )
  return data
}

/**
 * incoming-orders를 프록시 경유로 조회한다.
 * 직접 API URL은 CORS 문제가 있을 수 있으므로 프록시 사용.
 */
async function getIncomingOrdersSafe(
  employeeId: string,
): Promise<IncomingOrdersApiResponse | null> {
  try {
    return await apiGet<IncomingOrdersApiResponse>(
      `/employees/${encodeURIComponent(employeeId)}/incoming-orders`,
    )
  } catch {
    return null
  }
}

/**
 * 전체 배송기사 목록을 조회한다.
 * DRV001~DRV100을 직접 API URL로 조회하여 Vite 프록시 병목을 우회한다.
 * 5명씩 배치, 200ms 딜레이로 API 스로틀링 방지.
 */
let employeeCache: CurrentUser[] | null = null
let cachePromise: Promise<CurrentUser[]> | null = null

async function loadAllEmployees(): Promise<CurrentUser[]> {
  if (employeeCache) return employeeCache
  if (cachePromise) return cachePromise

  cachePromise = doLoadAllEmployees()
  try {
    const result = await cachePromise
    employeeCache = result
    return result
  } finally {
    cachePromise = null
  }
}

async function doLoadAllEmployees(): Promise<CurrentUser[]> {
  const allEmployees: CurrentUser[] = []
  const BATCH_SIZE = 10
  const TOTAL = 100

  console.log('[EmployeeService] 전체 직원 로딩 시작 (직접 API 호출)')

  for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
    const promises: Promise<void>[] = []

    for (let i = batch + 1; i <= Math.min(batch + BATCH_SIZE, TOTAL); i++) {
      const id = `DRV${String(i).padStart(3, '0')}`
      promises.push(
        getEmployeeDirect(id)
          .then((emp) => { if (emp) allEmployees.push(emp) }),
      )
    }

    await Promise.all(promises)
    // 배치 간 최소 딜레이
    if (batch + BATCH_SIZE < TOTAL) {
      await new Promise((r) => setTimeout(r, 50))
    }
  }

  console.log(`[EmployeeService] 전체 직원 로딩 완료: ${allEmployees.length}명`)
  return allEmployees
}

/**
 * 특정 허브에 소속된 배송기사 목록을 조회한다.
 */
export async function getEmployeesByHubId(hubId: string): Promise<CurrentUser[]> {
  const all = await loadAllEmployees()
  return all.filter((emp) => emp.hubId === hubId)
}

/**
 * 특정 허브의 직원들과 각 직원의 incoming-orders를 함께 조회한다.
 * 직접 API URL을 사용하여 Vite 프록시 병목을 우회한다.
 */
export async function getEmployeesWithOrdersByHubId(
  hubId: string,
): Promise<{ employee: CurrentUser; orders: IncomingOrdersApiResponse | null }[]> {
  const employees = await getEmployeesByHubId(hubId)

  if (employees.length === 0) return []

  const results: { employee: CurrentUser; orders: IncomingOrdersApiResponse | null }[] = []
  const BATCH_SIZE = 10

  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((emp) => getIncomingOrdersSafe(emp.employeeId)),
    )

    batch.forEach((emp, idx) => {
      results.push({
        employee: emp,
        orders: batchResults[idx],
      })
    })
  }

  return results
}

/**
 * 캐시를 초기화한다.
 */
export function clearEmployeeCache(): void {
  employeeCache = null
  cachePromise = null
}

/**
 * 직원 캐시를 백그라운드에서 미리 로드한다.
 */
export function preloadEmployeeCache(): void {
  void loadAllEmployees()
}
