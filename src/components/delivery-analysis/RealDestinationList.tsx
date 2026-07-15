import { useState } from 'react'
import type { RealDestination } from '../../types/deliveryAnalysis'

interface RealDestinationListProps {
  destinations: RealDestination[]
  availableMinutes: number
  isLoading?: boolean
}

type SortKey = 'sequence' | 'distance' | 'round-trip'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'sequence', label: '기본순' },
  { key: 'distance', label: '거리 가까운 순' },
  { key: 'round-trip', label: '왕복시간 짧은 순' },
]

function sortDestinations(destinations: RealDestination[], sortKey: SortKey): RealDestination[] {
  const sorted = [...destinations]

  switch (sortKey) {
    case 'sequence':
      return sorted.sort((a, b) => a.sequence - b.sequence)
    case 'distance':
      return sorted.sort((a, b) => a.distanceFromHubKm - b.distanceFromHubKm)
    case 'round-trip':
      return sorted.sort((a, b) => a.roundTripMinutes - b.roundTripMinutes)
    default:
      return sorted
  }
}

export function RealDestinationList({ destinations, availableMinutes, isLoading }: RealDestinationListProps) {
  const [sortKey, setSortKey] = useState<SortKey>('distance')
  const [isExpanded, setIsExpanded] = useState(false)

  const feasibleCount = destinations.filter((d) => d.roundTripMinutes <= availableMinutes).length

  if (isLoading) {
    return (
      <section className="card destination-list-card">
        <div className="card-header">
          <h2>배송지 목록</h2>
          <span className="badge badge-info">실시간</span>
        </div>
        <div className="loading-state">배송지 정보를 불러오는 중입니다.</div>
      </section>
    )
  }

  if (destinations.length === 0) {
    return (
      <section className="card destination-list-card">
        <div className="card-header">
          <h2>배송지 목록</h2>
        </div>
        <div className="empty-state">배송지 정보가 없습니다.</div>
      </section>
    )
  }

  const sortedDestinations = sortDestinations(destinations, sortKey)

  return (
    <section className="card destination-list-card">
      <div className="card-header card-header-toggle">
        <div className="card-header-left">
          <h2>배송지 목록</h2>
          <span className="badge badge-info">{destinations.length}건 · 투입 가능 {feasibleCount}건</span>
        </div>
        <button
          className="btn btn-sm toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="destination-list-content"
        >
          {isExpanded ? '접기 ▲' : '펼치기 ▼'}
        </button>
      </div>

      {isExpanded && (
        <div id="destination-list-content">
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
                  <th>#</th>
                  <th>배송지 ID</th>
                  <th>주소</th>
                  <th>거리</th>
                  <th>편도</th>
                  <th>왕복</th>
                  <th>투입 가능</th>
                </tr>
              </thead>
              <tbody>
                {sortedDestinations.map((dest, idx) => {
                  const feasible = dest.roundTripMinutes <= availableMinutes
                  return (
                    <tr key={dest.destinationId} className={feasible ? '' : 'row-muted'}>
                      <td>{idx + 1}</td>
                      <td>{dest.destinationId}</td>
                      <td className="text-secondary">{dest.address}</td>
                      <td>{dest.distanceFromHubKm}km</td>
                      <td>{dest.travelMinutes}분</td>
                      <td className={feasible ? 'value-highlight' : 'danger-text'}>
                        {dest.roundTripMinutes}분
                      </td>
                      <td>
                        <span className={`status-badge ${feasible ? 'status-normal' : 'status-urgent'}`}>
                          {feasible ? '가능' : '불가'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
