import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../layout/PageHeader'
import { SummaryMetricCard } from '../dashboard/SummaryMetricCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { AiSummaryCard } from './AiSummaryCard'
import { HubDetailPanel } from './HubDetailPanel'
import { HubOperationTable } from './HubOperationTable'
import { getAdminAnalysis } from '../../services/deliveryAnalysisService'
import { getEmployeesByHubId } from '../../services/employeeService'
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

  // 허브 상세 선택 시 실제 API에서 해당 허브 직원 조회
  const handleSelectHub = useCallback(async (hubId: string) => {
    setSelectedHubId(hubId)
    setIsLoadingDetail(true)
    setHubDetailOverride(null)

    try {
      const employees = await getEmployeesByHubId(hubId)
      const hubRow = data?.hubs.find((h) => h.hubId === hubId)
      const mockDetail = data?.hubDetails[hubId]

      // API에서 가져온 직원 목록을 HubEmployee 형태로 변환
      const hubEmployees: HubEmployee[] = employees.map((emp: CurrentUser) => ({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        status: 'AVAILABLE' as const, // 실제 상태는 AI 분석 후 결정. 현재는 기본 AVAILABLE
        recommendedArea: '-',
        estimatedReturnTime: '-',
        bufferMinutes: 0,
      }))

      const detail: HubDetail = {
        hubId,
        hubName: hubRow?.hubName ?? mockDetail?.hubName ?? hubId,
        lastVehicleEta: hubRow?.lastVehicleEta ?? mockDetail?.lastVehicleEta ?? '-',
        waitingEmployees: hubEmployees.length,
        employees: hubEmployees,
        expectedDeliveries: hubRow?.expectedDeliveries ?? mockDetail?.expectedDeliveries ?? 0,
        riskFactors: mockDetail?.riskFactors ?? [],
      }

      setHubDetailOverride(detail)
    } catch {
      // API 실패 시 기존 mock 데이터 사용
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
          label="대기 직원"
          value={`${data.summary.waitingEmployees}명`}
        />
        <SummaryMetricCard
          label="투입 가능"
          value={`${data.summary.availableEmployees}명`}
          variant="success"
        />
        <SummaryMetricCard
          label="주의 필요"
          value={`${data.summary.cautionEmployees}명`}
          variant="warning"
        />
        <SummaryMetricCard
          label="투입 불가"
          value={`${data.summary.unavailableEmployees}명`}
          variant="danger"
        />
        <SummaryMetricCard
          label="예상 처리 건수"
          value={`${data.summary.expectedDeliveries}건`}
          variant="info"
        />
        <SummaryMetricCard
          label="평균 활용 가능 시간"
          value={`${data.summary.averageIdleMinutes}분`}
        />
      </section>

      <AiSummaryCard summary={data.aiSummary} />

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
