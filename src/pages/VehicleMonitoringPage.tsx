import { useCallback, useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import type { AppShellContext } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { VehicleMap } from '../components/vehicles/VehicleMap'
import { getHubs } from '../services/hubService'
import { getVehicles } from '../services/vehicleService'
import type { Hub } from '../types/hub'
import type { VehicleWithEta } from '../types/vehicle'

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function VehicleMonitoringPage() {
  const { role, refreshKey } = useOutletContext<AppShellContext>()
  const [searchParams] = useSearchParams()
  const initialVehicleId = searchParams.get('vehicleId') ?? undefined
  const initialHubId = searchParams.get('hubId') ?? undefined
  const initialRegion = searchParams.get('region') ?? undefined
  const [vehicles, setVehicles] = useState<VehicleWithEta[]>([])
  const [hubs, setHubs] = useState<Hub[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState(getCurrentTime())

  const loadMapData = useCallback(() => {
    setErrorMessage(null)
    Promise.all([getVehicles(role), getHubs()])
      .then(([vehicleData, hubData]) => {
        setVehicles(vehicleData)
        setHubs(hubData)
        setUpdatedAt(getCurrentTime())
      })
      .catch(() => {
        setErrorMessage('차량 위치 정보를 불러오지 못했습니다.')
      })
      .finally(() => setIsInitialLoading(false))
  }, [role])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadMapData, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadMapData, refreshKey])

  if (isInitialLoading) {
    return <div className="loading-state">차량 위치 정보를 불러오는 중입니다.</div>
  }

  if (errorMessage) {
    return (
      <Card title="데이터 조회 오류">
        <div className="empty-state">
          <p>{errorMessage}</p>
          <Button onClick={loadMapData}>다시 시도</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="page-stack">
      <PageHeader
        description={
          role === 'ADMIN'
            ? '전체 Hub와 차량 위치, ETA, 지연 상태를 지도에서 확인합니다.'
            : '내 Hub로 도착 예정인 차량 위치, ETA, 지연 상태를 지도에서 확인합니다.'
        }
        title="실시간 차량 위치"
        updatedAt={updatedAt}
      />
      <VehicleMap hubs={hubs} role={role} vehicles={vehicles} initialVehicleId={initialVehicleId} initialHubId={initialHubId} initialRegion={initialRegion} />
    </div>
  )
}
