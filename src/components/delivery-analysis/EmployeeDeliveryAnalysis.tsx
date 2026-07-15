import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../layout/PageHeader'
import { SummaryMetricCard } from '../dashboard/SummaryMetricCard'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { RealDestinationList } from './RealDestinationList'
import { AiQuestionPanel } from './AiQuestionPanel'
import { useAuth } from '../../contexts/AuthContext'
import { getEmployeeAnalysis, fetchRealDestinations, requestAutoOptimization } from '../../services/deliveryAnalysisService'
import { getHubs } from '../../services/hubService'
import type { ChatOptimizationResponse } from '../../types/chat'
import type { DeliveryDecision, EmployeeAnalysisData, RealDestination, RiskLevel } from '../../types/deliveryAnalysis'

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
  const navigate = useNavigate()
  const [data, setData] = useState<EmployeeAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<'depart' | 'wait' | null>(null)

  // 실제 배송지 데이터
  const [realDestinations, setRealDestinations] = useState<RealDestination[]>([])
  const [destLoading, setDestLoading] = useState(false)

  // 허브 좌표 (FM 호출 및 거리 계산에 사용)
  const hubCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  // FM 최적화 관련 상태
  const [fmResult, setFmResult] = useState<ChatOptimizationResponse | null>(null)
  const [fmLoading, setFmLoading] = useState(false)
  const [fmError, setFmError] = useState<string | null>(null)
  const fmAbortRef = useRef<AbortController | null>(null)

  const loadData = useCallback(() => {
    setError(null)
    getEmployeeAnalysis(user)
      .then((result) => {
        setData(result)
      })
      .catch(() => setError('분석 데이터를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false))
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadData, refreshKey])

  // 데이터 로드 완료 후: 허브 좌표 조회 → 실제 배송지 조회 → FM 자동 호출
  useEffect(() => {
    if (!data) return

    const vehicleId = data.situation.assignedVehicleId
    const hubId = data.situation.hubId
    if (!vehicleId || !hubId) return

    fmAbortRef.current?.abort()
    const controller = new AbortController()
    fmAbortRef.current = controller

    let cancelled = false

    const runAll = async () => {
      setFmLoading(true)
      setFmError(null)
      setDestLoading(true)

      try {
        // 1. 허브 좌표 조회
        let hubLat = hubCoordsRef.current?.lat
        let hubLng = hubCoordsRef.current?.lng

        if (hubLat == null || hubLng == null) {
          const hubs = await getHubs()
          const hub = hubs.find((h) => h.hubId === hubId)
          if (hub) {
            hubLat = hub.location.lat
            hubLng = hub.location.lng
            hubCoordsRef.current = { lat: hubLat, lng: hubLng }
          } else {
            // 허브를 못 찾으면 기본 좌표 (부산 기준)
            hubLat = 35.1796
            hubLng = 129.0756
          }
        }

        if (cancelled) return

        // 2. 실제 배송지 조회
        const destinations = await fetchRealDestinations(vehicleId, hubLat, hubLng, controller.signal)
        if (!cancelled) {
          setRealDestinations(destinations)
          setDestLoading(false)
        }

        if (cancelled) return

        // 3. FM 최적화 자동 호출
        const result = await requestAutoOptimization(
          data.situation,
          vehicleId,
          hubLat,
          hubLng,
          controller.signal,
        )
        if (!cancelled) {
          setFmResult(result)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!cancelled) {
          setFmError('AI 자동 분석에 실패했습니다. 수동으로 재시도할 수 있습니다.')
          setDestLoading(false)
        }
      } finally {
        if (!cancelled) {
          setFmLoading(false)
        }
      }
    }

    void runAll()

    return () => {
      cancelled = true
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.situation.assignedVehicleId, data?.situation.availableIdleMinutes])

  // FM 최적화 수동 재호출
  const handleRequestOptimization = useCallback(async () => {
    if (!data) return

    const vehicleId = data.situation.assignedVehicleId
    if (!vehicleId) return

    const hubLat = hubCoordsRef.current?.lat
    const hubLng = hubCoordsRef.current?.lng
    if (hubLat == null || hubLng == null) return

    fmAbortRef.current?.abort()
    const controller = new AbortController()
    fmAbortRef.current = controller

    setFmLoading(true)
    setFmError(null)

    try {
      const result = await requestAutoOptimization(data.situation, vehicleId, hubLat, hubLng, controller.signal)
      setFmResult(result)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setFmError('AI 분석 요청에 실패했습니다.')
    } finally {
      setFmLoading(false)
    }
  }, [data])

  // 컴포넌트 언마운트 시 abort
  useEffect(() => {
    return () => {
      fmAbortRef.current?.abort()
    }
  }, [])

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

  const { situation, decision, aiQa, defaultAnswer } = data

  // FM 결과가 있으면 FM의 decision을, 없으면 기존 mock decision 사용
  const activeDecision: DeliveryDecision = fmResult?.decision ?? decision.decision
  const decisionStyle = decisionStyles[activeDecision]

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
            {fmResult && <span className="badge badge-info">실시간 AI</span>}
            {fmLoading && <span className="badge badge-info">분석 중...</span>}
          </div>
          <button
            className="btn btn-sm"
            onClick={handleRequestOptimization}
            disabled={fmLoading}
          >
            {fmLoading ? '분석 중...' : '재분석'}
          </button>
        </div>
        <div className="decision-content">
          <h3 className="decision-title">{fmResult ? 'AI 경로 분석 완료' : decision.title}</h3>
          <p className="decision-summary">{fmResult?.summary ?? decision.summary}</p>

          {/* FM 결과가 있을 때 FM 옵션 표시 */}
          {fmResult && fmResult.options.length > 0 && (
            <div className="fm-options">
              <h4 className="fm-options-title">AI 추천 경로 옵션</h4>
              <p className="fm-options-hint">옵션을 클릭하면 최적 경로를 확인할 수 있습니다.</p>
              <div className="fm-options-grid">
                {fmResult.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`fm-option-item fm-option-clickable risk-border-${opt.riskLevel.toLowerCase()}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      navigate('/route-optimization', {
                        state: {
                          deliveryIds: opt.deliveries,
                          vehicleId: data?.situation.assignedVehicleId,
                          hubId: data?.situation.hubId,
                          optionName: opt.name,
                          allOptions: fmResult.options.map((o) => ({ name: o.name, deliveries: o.deliveries })),
                        },
                      })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate('/route-optimization', {
                          state: {
                            deliveryIds: opt.deliveries,
                            vehicleId: data?.situation.assignedVehicleId,
                            hubId: data?.situation.hubId,
                            optionName: opt.name,
                            allOptions: fmResult.options.map((o) => ({ name: o.name, deliveries: o.deliveries })),
                          },
                        })
                      }
                    }}
                  >
                    <div className="fm-option-header">
                      <span className="fm-option-name">{opt.name}</span>
                      <span className={`risk-badge risk-${opt.riskLevel.toLowerCase()}`}>
                        {riskLabels[opt.riskLevel]}
                      </span>
                    </div>
                    <dl className="fm-option-details">
                      <div>
                        <dt>배송 건수</dt>
                        <dd>{opt.totalDeliveries}건</dd>
                      </div>
                      <div>
                        <dt>예상 복귀</dt>
                        <dd>{opt.estimatedReturnTime}</dd>
                      </div>
                      <div>
                        <dt>여유시간</dt>
                        <dd className={opt.marginMinutes < 15 ? 'text-warning' : ''}>
                          {opt.marginMinutes}분
                        </dd>
                      </div>
                    </dl>
                    <p className="fm-option-deliveries">
                      배송: {opt.deliveries.join(', ')}
                    </p>
                    <span className="fm-option-action">최적 경로 보기 →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FM 결과가 없을 때 기존 mock decision 메트릭 표시 */}
          {!fmResult && !fmLoading && (
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
          )}

          {(fmResult?.warning ?? decision.warning) && (
            <p className="decision-warning">⚠ {fmResult?.warning ?? decision.warning}</p>
          )}

          {fmError && (
            <p className="decision-warning">⚠ {fmError}</p>
          )}
        </div>
      </section>

      {/* AI 질문 영역 */}
      <AiQuestionPanel qaList={aiQa} defaultAnswer={defaultAnswer} />

      {/* 실제 배송지 목록 (route-input API 기반, 접기 가능) */}
      <RealDestinationList
        destinations={realDestinations}
        availableMinutes={situation.availableIdleMinutes}
        isLoading={destLoading}
      />

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
                ? 'AI 추천 경로를 선택했습니다.'
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
