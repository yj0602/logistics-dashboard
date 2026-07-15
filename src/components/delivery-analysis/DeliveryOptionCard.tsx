import type { DeliveryOption, RiskLevel } from '../../types/deliveryAnalysis'

interface DeliveryOptionCardProps {
  option: DeliveryOption
  isSelected: boolean
  onSelect: (optionId: string) => void
}

const riskLabels: Record<RiskLevel, string> = {
  LOW: '안정',
  MEDIUM: '주의',
  HIGH: '위험',
}

export function DeliveryOptionCard({ option, isSelected, onSelect }: DeliveryOptionCardProps) {
  return (
    <div
      className={`delivery-option-card${isSelected ? ' is-selected' : ''}${option.recommended ? ' is-recommended' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(option.optionId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(option.optionId)
        }
      }}
    >
      <div className="option-card-header">
        <h3>{option.title}</h3>
        <div className="option-badges">
          {option.recommended && <span className="badge badge-recommended">AI 추천</span>}
          <span className={`risk-badge risk-${option.riskLevel.toLowerCase()}`}>
            {riskLabels[option.riskLevel]}
          </span>
        </div>
      </div>

      <p className="option-description">{option.description}</p>

      <dl className="option-details">
        <div>
          <dt>배송 건수</dt>
          <dd>{option.destinationCount}건</dd>
        </div>
        <div>
          <dt>총 거리</dt>
          <dd>{option.totalDistanceKm}km</dd>
        </div>
        <div>
          <dt>이동시간</dt>
          <dd>{option.travelMinutes}분</dd>
        </div>
        <div>
          <dt>현장 처리</dt>
          <dd>{option.serviceMinutes}분</dd>
        </div>
        <div>
          <dt>예상 복귀</dt>
          <dd className="option-value-highlight">{option.estimatedReturnTime}</dd>
        </div>
        <div>
          <dt>여유시간</dt>
          <dd className={`option-value-highlight${option.bufferMinutes < 15 ? ' text-warning' : ''}`}>
            {option.bufferMinutes}분
          </dd>
        </div>
      </dl>

      <button
        className={`btn ${isSelected ? 'btn-primary' : ''} option-select-btn`}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(option.optionId)
        }}
      >
        {isSelected ? '선택됨' : '선택'}
      </button>
    </div>
  )
}
