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
import type { EmployeeDashboardData } from '../types/dashboard'

export function EmployeeDashboardPage() {
  const navigate = useNavigate()
  const { refreshKey } = useOutletContext<AppShellContext>()
  const { user } = useAuth()
  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboardData = useCallback(() => {
    setErrorMessage(null)
    getEmployeeDashboardData(user?.hubId)
      .then(setData)
      .catch(() => {
        setErrorMessage('차량 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsInitialLoading(false))
  }, [user?.hubId])

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

  const waitingMinutes = data.summary.lastVehicleEta === '06:10' ? 40 : 0

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

      <Card title="내 중간 배송 추천">
        <div className="employee-recommendation">
          <div>
            <span>막차 도착까지</span>
            <strong>{waitingMinutes}분</strong>
          </div>
          <div>
            <span>현재 판단</span>
            <strong>추후 구현 예정</strong>
          </div>
          <p>
            중간 배송 투입 분석은 백엔드와 분석 기준 확정 후 구현합니다. 현재는
            직원 화면에서 필요한 위치와 ETA 범위만 표시합니다.
          </p>
        </div>
      </Card>
    </div>
  )
}
