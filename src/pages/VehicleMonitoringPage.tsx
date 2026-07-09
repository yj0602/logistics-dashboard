import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { AppShellContext } from '../components/layout/AppShell'
import { PageHeader } from '../components/layout/PageHeader'
import { VehicleMap } from '../components/vehicles/VehicleMap'
import { getVehicles } from '../services/vehicleService'
import type { VehicleWithEta } from '../types/vehicle'

export function VehicleMonitoringPage() {
  const { role } = useOutletContext<AppShellContext>()
  const [vehicles, setVehicles] = useState<VehicleWithEta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getVehicles(role)
      .then(setVehicles)
      .finally(() => setIsLoading(false))
  }, [role])

  if (isLoading) {
    return <div className="loading-state">차량 위치 정보를 불러오는 중입니다.</div>
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
        updatedAt="05:30"
      />
      <VehicleMap role={role} vehicles={vehicles} />
    </div>
  )
}
