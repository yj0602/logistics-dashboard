import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../layout/PageHeader'
import { SummaryMetricCard } from '../dashboard/SummaryMetricCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DeliveryOptionCard } from './DeliveryOptionCard'
import { DestinationList } from './DestinationList'
import { DeliveryRoutePreview } from './DeliveryRoutePreview'
import { AiQuestionPanel } from './AiQuestionPanel'
import { useAuth } from '../../contexts/AuthContext'
import { getEmployeeAnalysis } from '../../services/deliveryAnalysisService'
import type { DeliveryDecision, EmployeeAnalysisData, RiskLevel } from '../../types/deliveryAnalysis'

interface EmployeeDeliveryAnalysisProps {
  refreshKey: number
}

const decisionStyles: Record<DeliveryDecision, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  RECOMMENDED: { variant: 'success', label: '투입 권장' },
  CAUTION: { variant: 'warning', label: '조건부 가능' },
  NOT_RECOMMENDED: { variant: 'danger', label: '대기 권장' },
}

const riskLabels: Record<RiskLevel, string> = {
  LOW: '안정',
  MEDIUM: '주의',
  HIGH: '위험',
}

const vehicleStatusLabels: Record<string, string> = {
  ARRIVED: '도착',
  IN_TRANSIT: '운행 중',
  DELAYED: '지연',
}

export function EmployeeDeliveryAnalysis({ refreshKey }: EmployeeDeliveryAnalysisProps) {
  const { user } = useAuth()
  const [data, setData] = useState<EmployeeAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<'depart' | 'wait' | null>(null)

  const loadData = useCallback(() => {
    setError(null)
    getEmployeeAnalysis(user)
      .then((result) => {
        setData(result)
        setSelectedOptionId(result.decision.recommendedOptionId)
      })
      .catch(() => setError('분석 데이터를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData, refreshKey])

  if (isLoading) {
    return <div className="loading-state">분석 데이터를 불러오는 중입니다.</div>
  }

  if (error) {
    return (
      <Card title="데이터 조회 오류">
        <div className="empty-state">
          <p>{error}</p>
          <Button onClick={loadData}>다시 시도</Button>
        </div>
      </Card>
    )
  }

  if (!data) {
    return <div className="empty-state">표시할 분석 데이터가 없습니다.</div>
  }

  const { situation, decision, options, destinations, aiQa, defaultAnswer } = data
  const selectedOption = options.find((o) => o.optionId === selectedOptionId) ?? options[0]
  const selectedDestinations = destinations[selectedOption.optionId] ?? []
  const decisionStyle = decisionStyles[decision.decision]

  return (
    <div className="page-stack">
      <PageHeader
        title="중간 배송 투입 판단"
        description="배정 차량의 도착 예정 시간과 배송 경로를 비교하여 중간 배송 가능 여부를 확인합니다."
        updatedAt={data.updatedAt}
      />

      {/* 배정 차량 및 현재 상황 카드 */}
      <Card title="배정 차량 및 현재 상황">
        <div className="situation-grid">
          <dl className="situation-details">
            <div>
              <dt>소속 허브</dt>
              <dd>{situation.hubName}</dd>
            </div>
            <div>
              <dt>배정 차량</dt>
              <dd>{situation.assignedVehicleId}</dd>
            </div>
            <div>
              <dt>차량 상태</dt>
              <dd>
                <span className={`status-badge status-${situation.vehicleStatus.toLowerCase()}`}>
                  {vehicleStatusLabels[situation.vehicleStatus]}
                </span>
              </dd>
            </div>
            <div>
              <dt>막차 ETA</dt>
              <dd className="value-highlight">{situation.estimatedArrivalTime}</dd>
            </div>
            <div>
              <dt>현재 지연</dt>
              <dd className="danger-text">{situation.delayMinutes}분</dd>
            </div>
            <div>
              <dt>ETA 신뢰도</dt>
              <dd>{Math.round(situation.confidence * 100)}%</dd>
            </div>
            <div>
              <dt>ETA 갱신</dt>
              <dd>{situation.predictionUpdatedAt}</dd>
            </div>
            <div>
              <dt>사용 가능 유휴시간</dt>
              <dd className="value-highlight">{situation.availableIdleMinutes}분</dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* AI 판단 결과 카드 */}
      <section className={`card decision-card decision-${decisionStyle.variant}`}>
        <div className="card-header">
          <div className="ai-summary-title">
            <span className="ai-icon" aria-hidden="true">✦</span>
            <h2>AI 판단 결과</h2>
            <span className={`badge badge-${decisionStyle.variant}`}>{decisionStyle.label}</span>
          </div>
        </div>
        <div className="decision-content">
          <h3 className="decision-title">{decision.title}</h3>
          <p className="decision-summary">{decision.summary}</p>

          <div className="decision-metrics">
            <SummaryMetricCard
              label="예상 복귀"
              value={decision.estimatedReturnTime}
              variant="info"
            />
            <SummaryMetricCard
              label="막차 ETA"
              value={decision.lastVehicleEta}
            />
            <SummaryMetricCard
              label="안전 여유시간"
              value={`${decision.bufferMinutes}분`}
              variant={decision.bufferMinutes >= 20 ? 'success' : 'warning'}
            />
            <SummaryMetricCard
              label="위험도"
              value={riskLabels[decision.riskLevel]}
              variant={decision.riskLevel === 'LOW' ? 'success' : decision.riskLevel === 'MEDIUM' ? 'warning' : 'danger'}
            />
          </div>

          {decision.warning && (
            <p className="decision-warning">⚠ {decision.warning}</p>
          )}
        </div>
      </section>

      {/* 추천 배송안 카드 */}
      <section>
        <h2 className="section-title">추천 배송안</h2>
        <div className="options-grid">
          {options.map((option) => (
            <DeliveryOptionCard
              key={option.optionId}
              option={option}
              isSelected={selectedOptionId === option.optionId}
              onSelect={setSelectedOptionId}
            />
          ))}
        </div>
      </section>

      {/* 배송지 목록 + 경로 프리뷰 */}
      <div className="delivery-detail-grid">
        <DestinationList destinations={selectedDestinations} />
        <DeliveryRoutePreview
          option={selectedOption}
          destinations={selectedDestinations}
          hubName={situation.hubName}
        />
      </div>

      {/* AI 질문 영역 */}
      <AiQuestionPanel qaList={aiQa} defaultAnswer={defaultAnswer} />

      {/* 하단 실행 버튼 */}
      <div className="action-buttons">
        <Button variant="primary" onClick={() => setShowModal('depart')}>
          추천 경로로 출발
        </Button>
        <Button onClick={() => setShowModal('wait')}>
          대기 유지
        </Button>
      </div>

      {/* 확인 모달 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              {showModal === 'depart'
                ? `${selectedOption.title} 경로를 선택했습니다.`
                : '대기를 유지합니다.'}
            </h3>
            <p>
              {showModal === 'depart'
                ? '실제 연동 시 배차 상태가 변경됩니다.'
                : '막차 도착까지 현재 허브에서 대기합니다.'}
            </p>
            <Button variant="primary" onClick={() => setShowModal(null)}>
              확인
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
