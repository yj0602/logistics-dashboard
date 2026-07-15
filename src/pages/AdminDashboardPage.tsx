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
import { getAdminDashboardData } from '../services/dashboardService'
import type { AdminDashboardData } from '../types/dashboard'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { refreshKey } = useOutletContext<AppShellContext>()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboardData = useCallback(() => {
    setErrorMessage(null)
    getAdminDashboardData()
      .then(setData)
      .catch(() => {
        setErrorMessage('차량 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsInitialLoading(false))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboardData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboardData, refreshKey])

  // Build tooltip data: per-hub breakdown for each status
  const arrivedTooltipItems = useMemo(() => {
    if (!data) return []
    return data.hubs
      .filter((hub) => hub.arrivedVehicles > 0)
      .map((hub) => ({
        label: hub.hubId,
        value: `${hub.arrivedVehicles}대`,
      }))
  }, [data])

  const inTransitTooltipItems = useMemo(() => {
    if (!data) return []
    return data.hubs
      .filter((hub) => hub.inTransitVehicles > 0)
      .map((hub) => ({
        label: hub.hubId,
        value: `${hub.inTransitVehicles}대`,
      }))
  }, [data])

  const delayedTooltipItems = useMemo(() => {
    if (!data) return []
    return data.hubs
      .filter((hub) => hub.delayedVehicles > 0)
      .map((hub) => ({
        label: hub.hubId,
        value: `${hub.delayedVehicles}대`,
      }))
  }, [data])

  const alertHubTooltipItems = useMemo(() => {
    if (!data) return []
    return data.hubs
      .filter((hub) => {
        const hubVehicles = data.vehicles.filter(
          (v) => v.destinationHubId === hub.hubId && v.status !== 'ARRIVED',
        )
        return hubVehicles.some((v) => v.eta.delayMinutes >= 15)
      })
      .map((hub) => {
        const hubInfo = data.mapHubs.find((h) => h.hubId === hub.hubId)
        const maxDelay = Math.max(
          ...data.vehicles
            .filter((v) => v.destinationHubId === hub.hubId && v.status !== 'ARRIVED')
            .map((v) => v.eta.delayMinutes),
        )
        return {
          label: hub.hubId,
          value: `${hubInfo?.name ?? hub.hubId} · ${maxDelay}분 지연`,
        }
      })
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
        description="전체 Hub와 차량의 실시간 운행 현황을 확인합니다."
        title="관리자 대시보드"
        updatedAt={data.summary.predictionUpdatedAt}
      />

      <section className="metrics-grid metrics-grid-5" aria-label="전체 차량 현황 요약">
        <SummaryMetricCard
          label="전체 차량"
          value={`${data.summary.totalVehicles}대`}
        />
        <MetricTooltip items={arrivedTooltipItems} onItemClick={(hubId) => navigate(`/vehicles?hubId=${hubId}`)}>
          <SummaryMetricCard
            label="도착"
            value={`${data.summary.arrivedVehicles}대`}
            variant="success"
          />
        </MetricTooltip>
        <MetricTooltip items={inTransitTooltipItems} onItemClick={(hubId) => navigate(`/vehicles?hubId=${hubId}`)}>
          <SummaryMetricCard
            label="운행 중"
            value={`${data.summary.inTransitVehicles}대`}
            variant="info"
          />
        </MetricTooltip>
        <MetricTooltip items={delayedTooltipItems} onItemClick={(hubId) => navigate(`/vehicles?hubId=${hubId}`)}>
          <SummaryMetricCard
            label="지연 차량"
            value={`${data.summary.delayedVehicles}대`}
            variant="danger"
          />
        </MetricTooltip>
        <MetricTooltip items={alertHubTooltipItems} onItemClick={(hubId) => navigate(`/vehicles?hubId=${hubId}`)}>
          <SummaryMetricCard
            label="대응 필요 Hub"
            value={`${data.alertHubCount}개`}
            description="지연 15분 이상"
            variant="warning"
          />
        </MetricTooltip>
      </section>

      <section className="dashboard-grid">
        <Card
          className="dashboard-map-card"
          title="허브 목록 지도"
          action={<Button onClick={() => navigate('/vehicles')}>전체 지도 보기</Button>}
        >
          <VehicleMap
            compact
            hubs={data.mapHubs}
            vehicles={data.vehicles}
            onHubClick={(hubId) => navigate(`/vehicles?hubId=${hubId}`)}
            onRegionClick={(region) => navigate(`/vehicles?region=${encodeURIComponent(region)}`)}
          />
        </Card>

        <Card title="지연 차량 목록">
          {data.delayedVehicles.length === 0 ? (
            <div className="empty-state">현재 지연 차량이 없습니다.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>차량</th>
                    <th>도착 Hub</th>
                    <th>ETA</th>
                    <th>상태</th>
                    <th>지연</th>
                  </tr>
                </thead>
                <tbody>
                  {data.delayedVehicles.map((vehicle) => (
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
                      <td>{vehicle.destinationHubId}</td>
                      <td>{vehicle.status === 'ARRIVED' ? '-' : (vehicle.eta.estimatedArrivalTime ?? '-')}</td>
                      <td>
                        <StatusBadge status={vehicle.status} />
                      </td>
                      <td className="danger-text">{vehicle.eta.delayMinutes}분</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <Card title="Hub 운영 현황">
        {data.hubs.length === 0 ? (
          <div className="empty-state">현재 조회 가능한 Hub가 없습니다.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hub</th>
                  <th>도착</th>
                  <th>운행 중</th>
                  <th>지연</th>
                  <th>막차 ETA</th>
                </tr>
              </thead>
              <tbody>
                {data.hubs.map((hub) => (
                  <tr key={hub.hubId}>
                    <td
                      className="clickable-cell"
                      onClick={() => navigate(`/vehicles?hubId=${hub.hubId}`)}
                      role="link"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/vehicles?hubId=${hub.hubId}`)
                        }
                      }}
                    >
                      {hub.hubId}
                    </td>
                    <td>{hub.arrivedVehicles}</td>
                    <td>{hub.inTransitVehicles}</td>
                    <td className={hub.delayedVehicles > 0 ? 'danger-text' : ''}>
                      {hub.delayedVehicles}
                    </td>
                    <td>{hub.lastVehicleEta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
