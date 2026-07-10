import maplibregl from 'maplibre-gl'
import { useCallback, useRef, useState } from 'react'
import { AmazonMap } from '../components/map/AmazonMap'
import { mockRouteOptimizationInput } from '../mocks/mockRouteOptimization'
import { optimizeAndCalculateRoute } from '../services/routeOptimizationService'
import type { RouteOptimizationResult, RouteGeometry } from '../types/routeOptimization'

type TestStatus = 'idle' | 'loading' | 'success' | 'error'

export function RouteOptimizationTestPage() {
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [status, setStatus] = useState<TestStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RouteOptimizationResult | null>(null)

  const input = mockRouteOptimizationInput

  const addMarkers = useCallback(
    (map: maplibregl.Map) => {
      // 기존 마커 제거
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      // 출발지 마커
      const startEl = document.createElement('div')
      startEl.className = 'maplibre-hub-marker'
      startEl.innerHTML = '<span>S</span> 출발지'
      const startMarker = new maplibregl.Marker({ element: startEl })
        .setLngLat([input.startLocation.longitude, input.startLocation.latitude])
        .addTo(map)
      markersRef.current.push(startMarker)

      // 배송지 마커들
      input.destinations.forEach((dest, idx) => {
        const el = document.createElement('div')
        el.className = 'maplibre-vehicle-marker marker-in_transit'
        el.style.cursor = 'default'
        el.innerHTML = `${idx + 1}<span class="marker-sub-label">${dest.name}</span>`
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([dest.longitude, dest.latitude])
          .addTo(map)
        markersRef.current.push(marker)
      })

      // 모든 좌표로 bounds 맞추기
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([input.startLocation.longitude, input.startLocation.latitude])
      input.destinations.forEach((d) => bounds.extend([d.longitude, d.latitude]))
      map.fitBounds(bounds, { padding: 60 })
    },
    [input],
  )

  // 지도 준비 시 마커 표시
  const handleMapReady = useCallback(
    (map: maplibregl.Map) => {
      mapInstanceRef.current = map
      addMarkers(map)
    },
    [addMarkers],
  )

  // 경로 최적화 + 도로 경로 계산 실행
  async function handleOptimize() {
    if (!mapInstanceRef.current) return
    setStatus('loading')
    setError(null)
    setResult(null)

    // 기존 경로 레이어 제거
    removeRouteLayer(mapInstanceRef.current)

    try {
      const { optimizationResult, routeGeometry } =
        await optimizeAndCalculateRoute(input)

      setResult(optimizationResult)
      setStatus('success')

      // 도로 경로를 지도에 그리기
      drawRoute(mapInstanceRef.current, routeGeometry)

      // 최적화된 순서로 마커 업데이트
      updateMarkersWithOptimizedOrder(mapInstanceRef.current, optimizationResult)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류'
      setError(msg)
      setStatus('error')
      console.error('[RouteOptimizationTest]', err)
    }
  }

  function removeRouteLayer(map: maplibregl.Map) {
    if (map.getLayer('optimized-route-line')) {
      map.removeLayer('optimized-route-line')
    }
    if (map.getSource('optimized-route')) {
      map.removeSource('optimized-route')
    }
  }

  function drawRoute(map: maplibregl.Map, routeGeometry: RouteGeometry) {
    map.addSource('optimized-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: routeGeometry.coordinates,
        },
      },
    })

    map.addLayer({
      id: 'optimized-route-line',
      type: 'line',
      source: 'optimized-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#1769e9',
        'line-width': 4,
        'line-opacity': 0.8,
      },
    })
  }

  function updateMarkersWithOptimizedOrder(
    map: maplibregl.Map,
    optimizationResult: RouteOptimizationResult,
  ) {
    // 기존 배송지 마커 제거 (인덱스 1부터 = 배송지 마커)
    markersRef.current.slice(1).forEach((m) => m.remove())
    markersRef.current = [markersRef.current[0]] // 출발지만 유지

    // 최적화된 순서대로 마커 다시 추가
    optimizationResult.optimizedOrder.forEach((wp) => {
      const dest = input.destinations.find(
        (d) => d.destinationId === wp.destinationId,
      )
      if (!dest) return
      const el = document.createElement('div')
      el.className = 'maplibre-vehicle-marker marker-arrived'
      el.style.cursor = 'default'
      el.innerHTML = `${wp.optimizedSequence}<span class="marker-sub-label">${dest.name}</span>`
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.longitude, dest.latitude])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>최적화 경로 조회</h1>
          <p>
            Amazon Location Service OptimizeWaypoints + CalculateRoutes
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOptimize}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '최적화 중...' : '경로 최적화 실행'}
        </button>
      </div>

      {/* 지도 영역 */}
      <div className="card">
        <div className="card-header">
          <h2>배송 경로 지도</h2>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            파란색 마커: 원래 순서 | 초록색 마커: 최적화된 순서
          </span>
        </div>
        <AmazonMap
          className="map-full"
          center={[input.startLocation.longitude, input.startLocation.latitude]}
          zoom={12}
          navigationControl
          onMapReady={handleMapReady}
        />
      </div>

      {/* 상태 표시 */}
      {status === 'error' && error && (
        <div
          className="card"
          style={{ borderColor: 'var(--red-600)', padding: '16px' }}
        >
          <p style={{ color: 'var(--red-600)', fontWeight: 800 }}>오류 발생</p>
          <p style={{ marginTop: '8px', fontSize: '13px' }}>{error}</p>
        </div>
      )}

      {/* 비교 결과 */}
      {result && (
        <div className="card">
          <div className="card-header">
            <h2>최적화 결과 비교</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>배송지 ID</th>
                  <th>배송지명</th>
                  <th>기존 순서</th>
                  <th>최적화 순서</th>
                  <th>변경 여부</th>
                </tr>
              </thead>
              <tbody>
                {result.optimizedOrder.map((wp) => {
                  const dest = input.destinations.find(
                    (d) => d.destinationId === wp.destinationId,
                  )
                  const changed = wp.originalSequence !== wp.optimizedSequence
                  return (
                    <tr key={wp.destinationId}>
                      <td>{wp.destinationId}</td>
                      <td>{dest?.name ?? '-'}</td>
                      <td>{wp.originalSequence ?? '-'}</td>
                      <td>
                        <strong>{wp.optimizedSequence}</strong>
                      </td>
                      <td>
                        {changed ? (
                          <span className="danger-text">변경됨</span>
                        ) : (
                          '동일'
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--gray-500)' }}>
              총 거리: {(result.totalDistanceMeters / 1000).toFixed(2)} km |
              총 소요시간: {Math.round(result.totalDurationSeconds / 60)} 분
            </div>
          </div>
        </div>
      )}

      {/* 입력 데이터 요약 */}
      <div className="card">
        <div className="card-header">
          <h2>입력 데이터 조회</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>순서</th>
                <th>배송지</th>
                <th>위도</th>
                <th>경도</th>
                <th>마감</th>
                <th>우선순위</th>
                <th>서비스 시간</th>
              </tr>
            </thead>
            <tbody>
              {input.destinations.map((dest) => (
                <tr key={dest.destinationId}>
                  <td>{dest.plannedSequence}</td>
                  <td>{dest.name}</td>
                  <td>{dest.latitude.toFixed(4)}</td>
                  <td>{dest.longitude.toFixed(4)}</td>
                  <td>{dest.deadline ?? '없음'}</td>
                  <td>{dest.priority}</td>
                  <td>{dest.serviceTimeMinutes}분</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
