import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { AppShellContext } from '../components/layout/AppShell'
import { SummaryMetricCard } from '../components/dashboard/SummaryMetricCard'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MetricTooltip } from '../components/ui/MetricTooltip'
import { StatusBadge } from '../components/ui/StatusBadge'
import { VehicleMap } from '../components/vehicles/VehicleMap'
import { useAuth } from '../contexts/AuthContext'
import { getEmployeeDashboardData } from '../services/dashboardService'
import { getEmployeeAnalysis } from '../services/deliveryAnalysisService'
import type { EmployeeDashboardData } from '../types/dashboard'
import type { EmployeeSituation } from '../types/deliveryAnalysis'

export function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { refreshKey } = useOutletContext<AppShellContext>()
  const { user } = useAuth()
  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [situation, setSituation] = useState<EmployeeSituation | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboardData = useCallback(() => {
    setErrorMessage(null)
    Promise.all([
      getEmployeeDashboardData(user?.hubId),
      getEmployeeAnalysis(user).then((result) => result.situation).catch(() => null),
    ])
      .then(([dashData, situationData]) => {
        setData(dashData)
        if (situationData) setSituation(situationData)
      })
      .catch(() => {
        setErrorMessage('차량 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsInitialLoading(false))
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboardData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboardData, refreshKey])

  // Tooltip items for employee metric cards
  const arrivedTooltipItems = useMemo(() => {
    if (!data) return []
    const arrivedVehicles = data.vehicles.filter((v) => v.status === 'ARRIVED')
    if (arrivedVehicles.length === 0) return []
    return [
      { label: data.hubName, value: `${arrivedVehicles.length}대 도착` },
      ...arrivedVehicles.map((v) => ({ label: v.vehicleId, value: v.departureHubId })),
    ]
  }, [data])

  const inTransitTooltipItems = useMemo(() => {
    if (!data) return []
    const transitVehicles = data.vehicles.filter((v) => v.status === 'IN_TRANSIT')
    if (transitVehicles.length === 0) return []
    return [
      { label: data.hubName, value: `${transitVehicles.length}대 운행 중` },
      ...transitVehicles.map((v) => ({
        label: v.vehicleId,
        value: v.eta.estimatedArrivalTime ?? '-',
      })),
    ]
  }, [data])

  const delayedTooltipItems = useMemo(() => {
    if (!data) return []
    const delayedVehicles = data.vehicles.filter((v) => v.status === 'DELAYED')
    if (delayedVehicles.length === 0) return []
    return [
      { label: data.hubName, value: `${delayedVehicles.length}대 지연` },
      ...delayedVehicles.map((v) => ({
        label: v.vehicleId,
        value: `${v.eta.delayMinutes}분 지연`,
      })),
    ]
  }, [data])

  const lastVehicle = useMemo(() => {
    if (!data) return null
    const pending = data.vehicles
      .filter((v) => v.status !== 'ARRIVED' && v.eta.estimatedArrivalTime)
      .sort((a, b) =>
        String(b.eta.estimatedArrivalTime).localeCompare(String(a.eta.estimatedArrivalTime)),
      )
    return pending[0] ?? null
  }, [data])

  const remainingMinutes = useMemo(() => {
    if (!data) return null
    const etaStr = data.summary.lastVehicleEta
    if (!etaStr || etaStr === '-') return null
    const now = new Date()
    const [hours, minutes] = etaStr.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) return null
    const etaDate = new Date(now)
    etaDate.setHours(hours, minutes, 0, 0)
    const diff = Math.round((etaDate.getTime() - now.getTime()) / 60000)
    return diff
  }, [data])

  if (isInitialLoading) {
    return <div className="loading-state">차량 정보를 불러오는 중입니다.</div>
  }

  if (errorMessage) {
    return (
      <Card title="데이터 조회 오류">
        <div className="empty-state">
          <p>{errorMessage}</p>
          <Button onClick={loadDashboardData}>다시 시도</Button>
        </div>
      </Card>
    )
  }

  if (!data) {
    return <div className="empty-state">표시할 대시보드 데이터가 없습니다.</div>
  }

  return (
    <div className="page-stack">
      <PageHeader
        description={`${data.hubName}로 도착 예정인 차량 현황만 확인합니다.`}
        title="현장 직원 대시보드"
        updatedAt={data.summary.predictionUpdatedAt}
      />

      <section className="metrics-grid employee-metrics" aria-label="내 Hub 차량 현황">
        <SummaryMetricCard
          label="도착 예정"
          value={`${data.summary.totalVehicles}대`}
          description="내 Hub 전체"
        />
        <MetricTooltip items={arrivedTooltipItems} onItemClick={(label) => {
          const vehicle = data.vehicles.find((v) => v.vehicleId === label)
          if (vehicle) {
            navigate(`/vehicles?vehicleId=${label}`)
          } else {
            navigate(`/vehicles?hubId=${data.hubId}`)
          }
        }}>
          <SummaryMetricCard
            label="도착 완료"
            value={`${data.summary.arrivedVehicles}대`}
            variant="success"
          />
        </MetricTooltip>
        <MetricTooltip items={inTransitTooltipItems} onItemClick={(label) => {
          const vehicle = data.vehicles.find((v) => v.vehicleId === label)
          if (vehicle) {
            navigate(`/vehicles?vehicleId=${label}`)
          } else {
            navigate(`/vehicles?hubId=${data.hubId}`)
          }
        }}>
          <SummaryMetricCard
            label="운행 중"
            value={`${data.summary.inTransitVehicles}대`}
            variant="info"
          />
        </MetricTooltip>
        <MetricTooltip items={delayedTooltipItems} onItemClick={(label) => {
          const vehicle = data.vehicles.find((v) => v.vehicleId === label)
          if (vehicle) {
            navigate(`/vehicles?vehicleId=${label}`)
          } else {
            navigate(`/vehicles?hubId=${data.hubId}`)
          }
        }}>
          <SummaryMetricCard
            label="지연 차량"
            value={`${data.summary.delayedVehicles}대`}
            variant="danger"
          />
        </MetricTooltip>
        <SummaryMetricCard
          label="막차 ETA"
          value={data.summary.lastVehicleEta}
          description="예상 도착 시간"
          variant="warning"
        />
      </section>

      <section className="dashboard-grid">
        <Card
          className="dashboard-map-card"
          title="내 Hub 차량 위치"
          action={<Button onClick={() => navigate('/vehicles')}>전체 지도 보기</Button>}
        >
          <VehicleMap compact role="EMPLOYEE" hubs={data.mapHubs} vehicles={data.vehicles} employeeHubId={user?.hubId} />
        </Card>

        <Card title="내 Hub 차량 현황">
          {data.vehicles.length === 0 ? (
            <div className="empty-state">현재 조회 가능한 차량이 없습니다.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>차량</th>
                    <th>출발지</th>
                    <th>ETA</th>
                    <th>상태</th>
                    <th>지연</th>
                  </tr>
                </thead>
                <tbody>
                  {data.vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.vehicleId}
                      className="clickable-row"
                      onClick={() =>
                        navigate(`/vehicles?vehicleId=${vehicle.vehicleId}`)
                      }
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/vehicles?vehicleId=${vehicle.vehicleId}`)
                        }
                      }}
                    >
                      <td>{vehicle.vehicleId}</td>
                      <td>{vehicle.departureHubId}</td>
                      <td>{vehicle.status === 'ARRIVED' ? '-' : (vehicle.eta.estimatedArrivalTime ?? '-')}</td>
                      <td>
                        <StatusBadge status={vehicle.status} />
                      </td>
                      <td className={vehicle.eta.delayMinutes > 0 ? 'danger-text' : ''}>
                        {vehicle.eta.delayMinutes > 0
                          ? `${vehicle.eta.delayMinutes}분`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <Card title="내 중간 배송 추천" action={
        lastVehicle ? <Button onClick={() => navigate('/delivery-analysis')}>상세 보기</Button> : undefined
      }>
        <div className="delivery-recommendation-summary">
          <div className="recommendation-metrics">
            <div className="recommendation-metric">
              <span className="recommendation-metric-label">막차 ETA</span>
              <strong className="recommendation-metric-value">
                {situation?.estimatedArrivalTime ?? data.summary.lastVehicleEta ?? '-'}
                {(situation?.delayMinutes ?? (lastVehicle?.eta.delayMinutes ?? 0)) > 0 && (
                  <span className="danger-text"> (+{situation?.delayMinutes ?? lastVehicle?.eta.delayMinutes}분)</span>
                )}
              </strong>
            </div>
            <div className="recommendation-metric">
              <span className="recommendation-metric-label">활용 가능 시간</span>
              <strong className={`recommendation-metric-value ${(situation?.availableIdleMinutes ?? remainingMinutes ?? 999) < 20 ? 'danger-text' : ''}`}>
                {situation
                  ? situation.availableIdleMinutes > 0
                    ? `${situation.availableIdleMinutes}분`
                    : '여유 없음'
                  : remainingMinutes !== null
                    ? remainingMinutes > 0
                      ? `${remainingMinutes}분`
                      : '도착 완료'
                    : '-'}
              </strong>
            </div>
            <div className="recommendation-metric">
              <span className="recommendation-metric-label">배정 차량</span>
              <strong className="recommendation-metric-value">
                {situation?.assignedVehicleId ?? '-'}
              </strong>
            </div>
            <div className="recommendation-metric">
              <span className="recommendation-metric-label">ETA 신뢰도</span>
              <strong className="recommendation-metric-value">
                {situation
                  ? `${Math.round(situation.confidence * 100)}%`
                  : '-'}
              </strong>
            </div>
          </div>
          {(situation?.availableIdleMinutes ?? remainingMinutes ?? 0) > 30 ? (
            <p className="recommendation-hint">
              막차 도착까지 여유 시간이 있어 중간 배송 투입이 가능합니다.
              중간 배송 페이지에서 AI 분석 결과와 추천 경로를 확인하세요.
            </p>
          ) : (situation?.availableIdleMinutes ?? remainingMinutes ?? 0) > 0 ? (
            <p className="recommendation-hint recommendation-hint-caution">
              막차 도착이 임박합니다. 중간 배송 투입 시 주의가 필요합니다.
            </p>
          ) : (
            <p className="recommendation-hint">
              현재 대기 중인 차량이 없거나 이미 모두 도착했습니다.
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
