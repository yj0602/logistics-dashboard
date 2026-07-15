import type { HubOperationRow, RiskLevel } from '../../types/deliveryAnalysis'

interface HubOperationTableProps {
  hubs: HubOperationRow[]
  onSelectHub: (hubId: string) => void
}

const riskLabels: Record<RiskLevel, string> = {
  LOW: '안정',
  MEDIUM: '주의',
  HIGH: '투입 비추천',
}

export function HubOperationTable({ hubs, onSelectHub }: HubOperationTableProps) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>허브별 운영 현황</h2>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>허브명</th>
              <th>막차 ETA</th>
              <th>남은 시간</th>
              <th>대기 직원</th>
              <th>투입 가능</th>
              <th>예상 처리 건수</th>
              <th>평균 복귀 여유</th>
              <th>위험도</th>
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
                <td>{hub.waitingEmployees}명</td>
                <td>{hub.availableEmployees}명</td>
                <td>{hub.expectedDeliveries}건</td>
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
                    상세 보기
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
