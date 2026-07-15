import type { EmployeeAvailability, HubDetail } from '../../types/deliveryAnalysis'

interface HubDetailPanelProps {
  detail: HubDetail
  onClose: () => void
}

const statusLabels: Record<EmployeeAvailability, string> = {
  AVAILABLE: '투입 가능',
  CAUTION: '조건부',
  UNAVAILABLE: '투입 불가',
}

export function HubDetailPanel({ detail, onClose }: HubDetailPanelProps) {
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
              <dt>대기 직원</dt>
              <dd>{detail.waitingEmployees}명</dd>
            </div>
            <div>
              <dt>예상 처리 건수</dt>
              <dd>{detail.expectedDeliveries}건</dd>
            </div>
          </dl>
        </div>

        <div className="hub-detail-section">
          <h3>투입 가능 직원 목록</h3>
          <div className="table-wrap">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>상태</th>
                  <th>추천 권역</th>
                  <th>예상 복귀</th>
                  <th>여유시간</th>
                </tr>
              </thead>
              <tbody>
                {detail.employees.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td>{emp.employeeName}</td>
                    <td>
                      <span
                        className={`risk-badge risk-${emp.status === 'AVAILABLE' ? 'low' : emp.status === 'CAUTION' ? 'medium' : 'high'}`}
                      >
                        {statusLabels[emp.status]}
                      </span>
                    </td>
                    <td>{emp.recommendedArea}</td>
                    <td>{emp.estimatedReturnTime}</td>
                    <td>{emp.bufferMinutes > 0 ? `${emp.bufferMinutes}분` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {detail.riskFactors.length > 0 && (
          <div className="hub-detail-section">
            <h3>위험 요소</h3>
            <ul className="risk-factor-list">
              {detail.riskFactors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
