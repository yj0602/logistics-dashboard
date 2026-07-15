import type { HubOperationRow, RiskLevel } from '../../types/deliveryAnalysis'

interface HubOperationTableProps {
  hubs: HubOperationRow[]
  onSelectHub: (hubId: string) => void
}

const riskLabels: Record<RiskLevel, string> = {
  LOW: '투입 가능',
  MEDIUM: '주의',
  HIGH: '투입 비추천',
}

export function HubOperationTable({ hubs, onSelectHub }: HubOperationTableProps) {
  if (hubs.length === 0) {
    return (
      <section className="card">
        <div className="card-header">
          <h2>허브별 운영 현황</h2>
        </div>
        <div className="empty-state">현재 도착 예정 차량이 있는 허브가 없습니다.</div>
      </section>
    )
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2>허브별 운영 현황</h2>
        <span className="badge badge-info">실시간 간선차량/ETA 기반</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>허브명</th>
              <th>막차 ETA</th>
              <th>남은 시간</th>
              <th>운행 중</th>
              <th>도착 완료</th>
              <th>복귀 여유</th>
              <th>투입 판단</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {hubs.map((hub) => (
              <tr
                key={hub.hubId}
                className="clickable-row"
                onClick={() => onSelectHub(hub.hubId)}
              >
                <td>{hub.hubName}</td>
                <td>{hub.lastVehicleEta}</td>
                <td>{hub.remainingMinutes}분</td>
                <td>{hub.waitingEmployees}대</td>
                <td>{hub.availableEmployees}대</td>
                <td>{hub.averageBufferMinutes}분</td>
                <td>
                  <span className={`risk-badge risk-${hub.riskLevel.toLowerCase()}`}>
                    {riskLabels[hub.riskLevel]}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectHub(hub.hubId)
                    }}
                  >
                    직원 조회
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
