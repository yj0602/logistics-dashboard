import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../layout/PageHeader'
import { SummaryMetricCard } from '../dashboard/SummaryMetricCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { AiSummaryCard } from './AiSummaryCard'
import { HubDetailPanel } from './HubDetailPanel'
import { HubOperationTable } from './HubOperationTable'
import { getAdminAnalysis } from '../../services/deliveryAnalysisService'
import { getEmployeesByHubId, getEmployeesWithOrdersByHubId, preloadEmployeeCache } from '../../services/employeeService'
import { hasAssignedEmployees } from '../../mocks/hubEmployeeMapping'
import type { IncomingOrdersApiResponse } from '../../types/api'
import type { AdminAnalysisData, HubDetail, HubEmployee } from '../../types/deliveryAnalysis'
import type { CurrentUser } from '../../types/auth'

interface AdminDeliveryAnalysisProps {
  refreshKey: number
}

export function AdminDeliveryAnalysis({ refreshKey }: AdminDeliveryAnalysisProps) {
  const [data, setData] = useState<AdminAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null)
  const [hubDetailOverride, setHubDetailOverride] = useState<HubDetail | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  const loadData = useCallback(() => {
    setError(null)
    // 백그라운드에서 직원 캐시 미리 로드 시작
    preloadEmployeeCache()
    getAdminAnalysis()
      .then(setData)
      .catch(() => setError('분석 데이터를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData, refreshKey])

  const handleRefresh = () => {
    setIsLoading(true)
    loadData()
  }

  // 허브 상세 선택 시 직원 조회 + incoming-orders (503 시 직원만 표시)
  const handleSelectHub = useCallback(async (hubId: string) => {
    setSelectedHubId(hubId)
    setIsLoadingDetail(true)
    setHubDetailOverride(null)

    try {
      const hubRow = data?.hubs.find((h) => h.hubId === hubId)
      const remainingMinutes = hubRow?.remainingMinutes ?? 0

      // 직원이 할당되지 않은 허브는 API 호출 없이 바로 표시
      if (!hasAssignedEmployees(hubId)) {
        const detail: HubDetail = {
          hubId,
          hubName: hubRow?.hubName ?? hubId,
          lastVehicleEta: hubRow?.lastVehicleEta ?? '-',
          waitingEmployees: 0,
          employees: [],
          expectedDeliveries: 0,
          riskFactors: ['배정된 직원이 없는 허브입니다.'],
        }
        setHubDetailOverride(detail)
        return
      }

      // 직원이 할당된 허브: 실제 조회
      const employees = await getEmployeesByHubId(hubId)
      console.log(`[AdminAnalysis] Hub ${hubId}: ${employees.length}명 조회됨`)

      if (employees.length === 0) {
        // 직원이 없는 허브
        const detail: HubDetail = {
          hubId,
          hubName: hubRow?.hubName ?? hubId,
          lastVehicleEta: hubRow?.lastVehicleEta ?? '-',
          waitingEmployees: 0,
          employees: [],
          expectedDeliveries: 0,
          riskFactors: [],
        }
        setHubDetailOverride(detail)
        return
      }

      // incoming-orders 시도 (503 등 실패 시 직원만 표시)
      let employeesWithOrders: { employee: CurrentUser; orders: IncomingOrdersApiResponse | null }[] | null = null
      try {
        employeesWithOrders = await getEmployeesWithOrdersByHubId(hubId)
      } catch {
        console.warn(`[AdminAnalysis] Hub ${hubId} incoming-orders 조회 실패, 직원 목록만 표시`)
      }

      // 직원별 데이터 구성
      const hubEmployees: HubEmployee[] = (employeesWithOrders ?? employees.map((e) => ({ employee: e, orders: null }))).map(
        (item) => {
          const employee = 'employee' in item ? item.employee : item
          const orders = 'orders' in item ? item.orders : null

          let status: 'AVAILABLE' | 'CAUTION' | 'UNAVAILABLE'

          if (!orders || orders.orderCount === 0) {
            // 주문 정보 없거나 배정 없음 → 유휴시간 기반 판정
            if (remainingMinutes >= 60) status = 'AVAILABLE'
            else if (remainingMinutes >= 30) status = 'CAUTION'
            else status = 'UNAVAILABLE'
          } else {
            const allArrived = orders.orders.every(
              (o) => o.lineHaulVehicle.status === 'ARRIVED',
            )
            const someArrived = orders.orders.some(
              (o) => o.lineHaulVehicle.status === 'ARRIVED',
            )

            if (allArrived) {
              status = remainingMinutes >= 30 ? 'AVAILABLE' : 'CAUTION'
            } else if (someArrived) {
              status = 'CAUTION'
            } else {
              status = remainingMinutes >= 60 ? 'CAUTION' : 'UNAVAILABLE'
            }
          }

          return {
            employeeId: employee.employeeId,
            employeeName: employee.name,
            status,
            recommendedArea: employee.assignedVehicleId ?? '-',
            estimatedReturnTime: orders ? `${orders.orderCount}건` : '-',
            bufferMinutes: remainingMinutes,
          }
        },
      )

      const totalOrders = employeesWithOrders
        ? employeesWithOrders.reduce((sum, { orders }) => sum + (orders?.orderCount ?? 0), 0)
        : 0

      const detail: HubDetail = {
        hubId,
        hubName: hubRow?.hubName ?? hubId,
        lastVehicleEta: hubRow?.lastVehicleEta ?? '-',
        waitingEmployees: hubEmployees.length,
        employees: hubEmployees,
        expectedDeliveries: totalOrders,
        riskFactors: employeesWithOrders ? [] : ['incoming-orders API 응답 불가 — 배송 건수 미확인'],
      }

      setHubDetailOverride(detail)
    } catch (err) {
      console.error(`[AdminAnalysis] Hub ${hubId} 직원 조회 실패:`, err)
      setHubDetailOverride(null)
    } finally {
      setIsLoadingDetail(false)
    }
  }, [data])

  if (isLoading) {
    return <div className="loading-state">분석 데이터를 불러오는 중입니다.</div>
  }

  if (error) {
    return (
      <Card title="데이터 조회 오류">
        <div className="empty-state">
          <p>{error}</p>
          <Button onClick={handleRefresh}>다시 시도</Button>
        </div>
      </Card>
    )
  }

  if (!data) {
    return <div className="empty-state">표시할 분석 데이터가 없습니다.</div>
  }

  const selectedDetail = hubDetailOverride ?? (selectedHubId ? data.hubDetails[selectedHubId] : null)

  return (
    <div className="page-stack">
      <PageHeader
        title="중간 배송 투입 분석"
        description="막차 도착 전 유휴시간을 활용할 수 있는 허브와 인력을 확인합니다."
        updatedAt={data.updatedAt}
      />

      <div className="page-header-actions">
        <Button onClick={handleRefresh}>새로고침</Button>
      </div>

      <section className="metrics-grid metrics-grid-6" aria-label="투입 분석 요약">
        <SummaryMetricCard
          label="운영 중 허브"
          value={`${data.hubs.length}개`}
        />
        <SummaryMetricCard
          label="투입 가능 허브"
          value={`${data.hubs.filter((h) => h.riskLevel === 'LOW').length}개`}
          variant="success"
        />
        <SummaryMetricCard
          label="주의 필요 허브"
          value={`${data.hubs.filter((h) => h.riskLevel === 'MEDIUM').length}개`}
          variant="warning"
        />
        <SummaryMetricCard
          label="투입 비추천 허브"
          value={`${data.hubs.filter((h) => h.riskLevel === 'HIGH').length}개`}
          variant="danger"
        />
        <SummaryMetricCard
          label="운행 중 간선차량"
          value={`${data.summary.waitingEmployees}대`}
          variant="info"
        />
        <SummaryMetricCard
          label="평균 유휴시간"
          value={`${data.summary.averageIdleMinutes}분`}
        />
      </section>

      <AiSummaryCard hubs={data.hubs} />

      <HubOperationTable
        hubs={data.hubs}
        onSelectHub={handleSelectHub}
      />

      {isLoadingDetail && selectedHubId && (
        <div className="loading-state">직원 정보를 조회하는 중입니다.</div>
      )}

      {selectedDetail && !isLoadingDetail && (
        <HubDetailPanel
          detail={selectedDetail}
          onClose={() => { setSelectedHubId(null); setHubDetailOverride(null) }}
        />
      )}
    </div>
  )
}
