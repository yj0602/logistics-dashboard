import type { VehicleStatus } from '../../types/vehicle'

const statusLabels: Record<VehicleStatus, string> = {
  ARRIVED: '도착',
  IN_TRANSIT: '운행 중',
  DELAYED: '지연',
}

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {statusLabels[status]}
    </span>
  )
}
