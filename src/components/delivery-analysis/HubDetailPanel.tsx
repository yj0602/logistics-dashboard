import type { EmployeeAvailability, HubDetail } from '../../types/deliveryAnalysis'

interface HubDetailPanelProps {
  detail: HubDetail
  onClose: () => void
}

const statusLabels: Record<EmployeeAvailability, string> = {
  AVAILABLE: '투입 가능',
  CAUTION: '주의',
  UNAVAILABLE: '대기 중',
}

export function HubDetailPanel({ detail, onClose }: HubDetailPanelProps) {
  const availableCount = detail.employees.filter((e) => e.status === 'AVAILABLE').length
  const cautionCount = detail.employees.filter((e) => e.status === 'CAUTION').length
  const unavailableCount = detail.employees.filter((e) => e.status === 'UNAVAILABLE').length

  return (
    <div className="hub-detail-overlay" onClick={onClose}>
      <aside
        className="hub-detail-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${detail.hubName} 상세 정보`}
      >
        <div className="hub-detail-header">
          <h2>{detail.hubName}</h2>
          <button className="btn btn-sm" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="hub-detail-summary">
          <dl>
            <div>
              <dt>막차 ETA</dt>
              <dd>{detail.lastVehicleEta}</dd>
            </div>
            <div>
              <dt>소속 직원</dt>
              <dd>{detail.waitingEmployees}명</dd>
            </div>
            <div>
              <dt>총 배송 건수</dt>
              <dd>{detail.expectedDeliveries}건</dd>
            </div>
            <div>
              <dt>투입 가능</dt>
              <dd className="value-highlight">{availableCount}명</dd>
            </div>
            <div>
              <dt>주의</dt>
              <dd>{cautionCount}명</dd>
            </div>
            <div>
              <dt>대기 중</dt>
              <dd>{unavailableCount}명</dd>
            </div>
          </dl>
        </div>

        <div className="hub-detail-section">
          <h3>직원별 배송 현황</h3>
          {detail.employees.length === 0 ? (
            <p className="text-secondary">이 허브에 소속된 직원 정보가 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table-compact">
                <thead>
                  <tr>
                    <th>직원 ID</th>
                    <th>이름</th>
                    <th>배정 차량</th>
                    <th>배송 건수</th>
                    <th>투입 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.employees.map((emp) => (
                    <tr key={emp.employeeId}>
                      <td>{emp.employeeId}</td>
                      <td>{emp.employeeName}</td>
                      <td>{emp.recommendedArea || '-'}</td>
                      <td>{emp.estimatedReturnTime}</td>
                      <td>
                        <span
                          className={`risk-badge risk-${emp.status === 'AVAILABLE' ? 'low' : emp.status === 'CAUTION' ? 'medium' : 'high'}`}
                        >
                          {statusLabels[emp.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
