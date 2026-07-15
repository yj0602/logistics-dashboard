import type { Destination, DeliveryOption } from '../../types/deliveryAnalysis'

interface DeliveryRoutePreviewProps {
  option: DeliveryOption
  destinations: Destination[]
  hubName: string
}

export function DeliveryRoutePreview({ option, destinations, hubName }: DeliveryRoutePreviewProps) {
  return (
    <section className="card route-preview-card">
      <div className="card-header">
        <h2>경로 미리보기</h2>
        <span className="badge badge-mock">지도 목업</span>
      </div>
      <div className="route-preview-map" aria-label="배송 경로 지도 목업">
        {/* Placeholder map area */}
        <div className="route-map-placeholder">
          <div className="route-map-content">
            <div className="route-node route-node-hub">
              <span className="route-marker">H</span>
              <span className="route-label">{hubName}</span>
            </div>

            <div className="route-path-line" />

            {destinations.map((dest) => (
              <div key={dest.destinationId} className="route-node route-node-dest">
                <span className="route-marker">{dest.sequence}</span>
                <span className="route-label">{dest.name}</span>
              </div>
            ))}

            <div className="route-path-line route-path-return" />

            <div className="route-node route-node-hub">
              <span className="route-marker">H</span>
              <span className="route-label">{hubName} (복귀)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="route-preview-summary">
        <dl>
          <div>
            <dt>총 거리</dt>
            <dd>{option.totalDistanceKm}km</dd>
          </div>
          <div>
            <dt>예상 이동시간</dt>
            <dd>{option.travelMinutes}분</dd>
          </div>
          <div>
            <dt>현장 처리시간</dt>
            <dd>{option.serviceMinutes}분</dd>
          </div>
          <div>
            <dt>총 소요시간</dt>
            <dd>{option.totalDurationMinutes}분</dd>
          </div>
          <div>
            <dt>예상 복귀시간</dt>
            <dd>{option.estimatedReturnTime}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
