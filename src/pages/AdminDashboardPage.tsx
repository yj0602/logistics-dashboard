import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SummaryMetricCard } from '../components/dashboard/SummaryMetricCard'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/StatusBadge'
import { VehicleMap } from '../components/vehicles/VehicleMap'
import { getAdminDashboardData } from '../services/dashboardService'
import type { AdminDashboardData } from '../types/dashboard'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboardData = useCallback(() => {
    setIsLoading(true)
    setErrorMessage(null)
    getAdminDashboardData()
      .then(setData)
      .catch(() => {
        setData(null)
        setErrorMessage('차량 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadDashboardData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboardData])

  if (isLoading) {
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

      <section className="metrics-grid" aria-label="전체 차량 현황 요약">
        <SummaryMetricCard
          description="전체 차량 수"
          label="전체 차량"
          value={`${data.summary.totalVehicles}대`}
        />
        <SummaryMetricCard
          description="도착한 차량 수"
          label="도착"
          tone="green"
          value={`${data.summary.arrivedVehicles}대`}
        />
        <SummaryMetricCard
          description="운행 중인 차량 수"
          label="운행 중"
          value={`${data.summary.inTransitVehicles}대`}
        />
        <SummaryMetricCard
          description="지연 중인 차량 수"
          label="지연 차량"
          tone="red"
          value={`${data.summary.delayedVehicles}대`}
        />
        <SummaryMetricCard
          description="가장 늦은 예상 도착 시간"
          label="막차 ETA"
          tone="purple"
          value={data.summary.lastVehicleEta}
        />
      </section>

      <section className="dashboard-grid">
        <Card
          className="dashboard-map-card"
          title="차량 위치 지도"
          action={<Button onClick={() => navigate('/vehicles')}>전체 지도 보기</Button>}
        >
          <VehicleMap compact hubs={data.mapHubs} vehicles={data.vehicles} />
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
                    <tr key={vehicle.vehicleId}>
                      <td>{vehicle.vehicleId}</td>
                      <td>{vehicle.destinationHubId}</td>
                      <td>{vehicle.eta.estimatedArrivalTime ?? '-'}</td>
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
        <div className="hub-summary-grid">
          {data.hubs.length === 0 ? (
            <div className="empty-state">현재 조회 가능한 Hub가 없습니다.</div>
          ) : (
            data.hubs.map((hub) => (
              <div className="hub-summary" key={hub.hubId}>
                <strong>{hub.hubId}</strong>
                <dl>
                  <div>
                    <dt>도착</dt>
                    <dd>{hub.arrivedVehicles}</dd>
                  </div>
                  <div>
                    <dt>운행 중</dt>
                    <dd>{hub.inTransitVehicles}</dd>
                  </div>
                  <div>
                    <dt>지연</dt>
                    <dd>{hub.delayedVehicles}</dd>
                  </div>
                  <div>
                    <dt>막차 ETA</dt>
                    <dd>{hub.lastVehicleEta}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
