import { useState } from 'react'
import type { Destination, DestinationSortKey, DestinationStatus } from '../../types/deliveryAnalysis'

interface DestinationListProps {
  destinations: Destination[]
}

const sortOptions: { key: DestinationSortKey; label: string }[] = [
  { key: 'ai-recommended', label: 'AI 추천순' },
  { key: 'round-trip', label: '왕복시간 짧은 순' },
  { key: 'distance', label: '허브에서 가까운 순' },
  { key: 'deadline', label: '마감 임박순' },
  { key: 'priority', label: '우선순위순' },
]

const statusLabels: Record<DestinationStatus, string> = {
  URGENT: '긴급',
  NORMAL: '일반',
  COMPLETED: '완료',
}

function sortDestinations(destinations: Destination[], sortKey: DestinationSortKey): Destination[] {
  const sorted = [...destinations]

  switch (sortKey) {
    case 'ai-recommended':
      return sorted.sort((a, b) => a.sequence - b.sequence)
    case 'round-trip':
      return sorted.sort((a, b) => (a.travelMinutes * 2 + a.serviceMinutes) - (b.travelMinutes * 2 + b.serviceMinutes))
    case 'distance':
      return sorted.sort((a, b) => a.distanceFromHubKm - b.distanceFromHubKm)
    case 'deadline':
      return sorted.sort((a, b) => a.deadline.localeCompare(b.deadline))
    case 'priority':
      return sorted.sort((a, b) => a.priority - b.priority)
    default:
      return sorted
  }
}

export function DestinationList({ destinations }: DestinationListProps) {
  const [sortKey, setSortKey] = useState<DestinationSortKey>('ai-recommended')

  const sortedDestinations = sortDestinations(destinations, sortKey)

  return (
    <section className="card destination-list-card">
      <div className="card-header">
        <h2>배송지 목록</h2>
      </div>
      <div className="destination-sort-bar">
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            className={`btn btn-sm${sortKey === opt.key ? ' btn-primary' : ''}`}
            onClick={() => setSortKey(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>순서</th>
              <th>배송지명</th>
              <th>주소</th>
              <th>거리</th>
              <th>이동시간</th>
              <th>작업시간</th>
              <th>마감</th>
              <th>우선순위</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {sortedDestinations.map((dest, idx) => (
              <tr key={dest.destinationId}>
                <td>{idx + 1}</td>
                <td>{dest.name}</td>
                <td className="text-secondary">{dest.address}</td>
                <td>{dest.distanceFromHubKm}km</td>
                <td>{dest.travelMinutes}분</td>
                <td>{dest.serviceMinutes}분</td>
                <td>{dest.deadline}</td>
                <td>{dest.priority}</td>
                <td>
                  <span className={`status-badge status-${dest.status.toLowerCase()}`}>
                    {statusLabels[dest.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
