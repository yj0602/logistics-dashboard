import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AmazonMap } from '../components/map/AmazonMap'
import { useAuth } from '../contexts/AuthContext'
import { getVehicleRouteInput } from '../services/routeInputService'
import { mapRouteInputResponse } from '../services/routeInputMapper'
import { optimizeAndCalculateRoute } from '../services/routeOptimizationService'
import { getHubs } from '../services/hubService'
import type {
  RouteOptimizationInput,
  RouteOptimizationResult,
  RouteGeometry,
  LocationPoint,
} from '../types/routeOptimization'
import type { Hub } from '../types/hub'
import { truncateAddressToDistrict } from '../utils/addressUtils'

type PageStatus = 'idle' | 'loading-input' | 'loading-optimize' | 'success' | 'error'

/**
 * 중간 배송 분석에서 FM 옵션 클릭 시 전달되는 navigation state
 */
interface FmOptionNav {
  name: string
  deliveries: string[]
}

interface RouteNavState {
  deliveryIds?: string[]
  vehicleId?: string
  hubId?: string
  optionName?: string
  /** FM이 제안한 모든 옵션 (페이지 내에서 필터 전환용) */
  allOptions?: FmOptionNav[]
}

export function RouteOptimizationTestPage() {
  const { user } = useAuth()
  const location = useLocation()
  const navState = (location.state as RouteNavState) ?? {}
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const autoRunRef = useRef(false)

  const [status, setStatus] = useState<PageStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RouteOptimizationResult | null>(null)
  const [input, setInput] = useState<RouteOptimizationInput | null>(null)

  // 허브 목록 (출발 허브 선택용)
  const [hubs, setHubs] = useState<Hub[]>([])
  const [selectedHubId, setSelectedHubId] = useState<string>(navState.hubId ?? user?.hubId ?? '')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [vehicleIdInput, setVehicleIdInput] = useState<string>(
    navState.vehicleId ?? user?.assignedVehicleId ?? '',
  )

  // 네비게이션에서 전달된 배송지 필터 (초기화 가능)
  const [filterDeliveryIds, setFilterDeliveryIds] = useState<string[] | null>(
    navState.deliveryIds && navState.deliveryIds.length > 0 ? navState.deliveryIds : null,
  )
  const [filterOptionName, setFilterOptionName] = useState<string | null>(navState.optionName ?? null)
  const [fmOptions] = useState<FmOptionNav[]>(navState.allOptions ?? [])

  // ─── 경로 입력 데이터 조회 + 최적화 실행 (공통 함수) ───

  async function runOptimization(
    vehicleId: string,
    startLocation: LocationPoint,
    deliveryIdFilter?: string[] | null,
  ) {
    // 이전 요청 취소
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading-input')
    setError(null)
    setResult(null)
    setInput(null)
    setSelectedVehicleId(vehicleId)

    // 기존 경로 레이어 제거
    if (mapInstanceRef.current) {
      removeRouteLayer(mapInstanceRef.current)
      clearMarkers()
    }

    try {
      // 1단계: API에서 경로 입력 데이터 조회
      const apiResponse = await getVehicleRouteInput(vehicleId, controller.signal)

      // 배송지 필터링 (FM 옵션에서 전달된 ID로 필터)
      if (deliveryIdFilter && deliveryIdFilter.length > 0) {
        apiResponse.destinations = apiResponse.destinations.filter((d) =>
          deliveryIdFilter.includes(d.destinationId),
        )
        apiResponse.destinationCount = apiResponse.destinations.length
      }

      // 2단계: API 응답 → 최적화 입력 변환 (허브 선택으로 출발 좌표 결정)
      const optimizationInput = mapRouteInputResponse(apiResponse, {
        startLocation,
        optimizationMode: 'FASTEST',
      })

      if (controller.signal.aborted) return

      setInput(optimizationInput)

      // 지도에 마커 표시
      if (mapInstanceRef.current) {
        addMarkers(mapInstanceRef.current, optimizationInput)
      }

      // 3단계: 최적화 실행
      setStatus('loading-optimize')
      const { optimizationResult, routeGeometry } =
        await optimizeAndCalculateRoute(optimizationInput)

      if (controller.signal.aborted) return

      setResult(optimizationResult)
      setStatus('success')

      // 지도에 경로 그리기 + 최적화된 순서로 마커 업데이트
      if (mapInstanceRef.current) {
        drawRoute(mapInstanceRef.current, routeGeometry)
        updateMarkersWithOptimizedOrder(
          mapInstanceRef.current,
          optimizationInput,
          optimizationResult,
        )
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(msg)
      setStatus('error')
      console.error('[RouteOptimizationTest]', err)
    }
  }

  // 초기 데이터 로드: 허브 목록 + 자동 실행 (네비게이션 state가 있을 때)
  useEffect(() => {
    async function loadBaseData() {
      try {
        const hubList = await getHubs()
        setHubs(hubList)
        // 로그인 사용자의 hubId가 목록에 있으면 자동 선택
        const targetHubId = navState.hubId ?? user?.hubId
        if (targetHubId && hubList.some((h) => h.hubId === targetHubId)) {
          setSelectedHubId(targetHubId)
        } else if (hubList.length > 0 && !selectedHubId) {
          setSelectedHubId(hubList[0].hubId)
        }

        // 네비게이션 state가 있으면 자동 실행
        if (filterDeliveryIds && navState.vehicleId && !autoRunRef.current) {
          autoRunRef.current = true
          // 허브 좌표 결정
          const hub = hubList.find((h) => h.hubId === (navState.hubId ?? user?.hubId))
          if (hub) {
            await runOptimization(
              navState.vehicleId,
              { latitude: hub.location.lat, longitude: hub.location.lng },
              filterDeliveryIds,
            )
          }
        }
      } catch (err) {
        console.error('[RouteOptimizationTest] 허브 데이터 로드 실패:', err)
      }
    }
    loadBaseData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  // 선택된 허브의 좌표를 반환
  function getSelectedHubLocation(): LocationPoint | null {
    const hub = hubs.find((h) => h.hubId === selectedHubId)
    if (!hub) return null
    return { latitude: hub.location.lat, longitude: hub.location.lng }
  }

  // ─── UI에서 수동 실행 ───

  async function handleFetchAndOptimize() {
    const vehicleId = vehicleIdInput.trim()
    if (!vehicleId) {
      setError('차량 ID를 입력해 주세요.')
      setStatus('error')
      return
    }

    const startLocation = getSelectedHubLocation()
    if (!startLocation) {
      setError('출발 허브를 선택해 주세요.')
      setStatus('error')
      return
    }

    await runOptimization(vehicleId, startLocation, filterDeliveryIds)
  }

  // ─── 필터 초기화 (전체 배송지 조회) ───

  async function handleReset() {
    setFilterDeliveryIds(null)
    setFilterOptionName(null)

    const vehicleId = vehicleIdInput.trim()
    if (!vehicleId) return

    const startLocation = getSelectedHubLocation()
    if (!startLocation) return

    await runOptimization(vehicleId, startLocation, null)
  }

  // ─── FM 옵션 필터 선택 ───

  async function handleSelectOption(option: FmOptionNav) {
    setFilterDeliveryIds(option.deliveries)
    setFilterOptionName(option.name)

    const vehicleId = vehicleIdInput.trim()
    if (!vehicleId) return

    const startLocation = getSelectedHubLocation()
    if (!startLocation) return

    await runOptimization(vehicleId, startLocation, option.deliveries)
  }

  // ─── 지도 마커 관리 ───

  function clearMarkers() {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }

  const addMarkers = useCallback(
    (map: maplibregl.Map, data: RouteOptimizationInput) => {
      clearMarkers()

      // 출발지 마커
      const startEl = document.createElement('div')
      startEl.className = 'route-start-marker'
      startEl.innerHTML = `<svg class="route-start-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V21H3z"/><path d="M9 21V12h6v9"/></svg><span class="route-start-label">출발 Hub</span>`
      const startMarker = new maplibregl.Marker({ element: startEl })
        .setLngLat([data.startLocation.longitude, data.startLocation.latitude])
        .addTo(map)
      markersRef.current.push(startMarker)

      // 배송지 마커들 (최적화 전 — 파란색)
      data.destinations.forEach((dest, idx) => {
        const el = document.createElement('div')
        el.className = 'route-dest-marker route-dest-before'
        const label = truncateAddressToDistrict(dest.address) || dest.name || dest.destinationId
        el.innerHTML = `<svg class="route-dest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V21H3z"/><path d="M9 21V12h6v9"/></svg><span class="route-dest-seq">${idx + 1}</span><span class="route-dest-label">${label}</span>`
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([dest.longitude, dest.latitude])
          .addTo(map)
        markersRef.current.push(marker)
      })

      // 모든 좌표로 bounds 맞추기
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([data.startLocation.longitude, data.startLocation.latitude])
      data.destinations.forEach((d) => bounds.extend([d.longitude, d.latitude]))
      map.fitBounds(bounds, { padding: 60 })
    },
    [],
  )

  // 지도 준비 시 콜백
  const handleMapReady = useCallback(
    (map: maplibregl.Map) => {
      mapInstanceRef.current = map
    },
    [],
  )

  // ─── 지도 경로 그리기 ───

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
    data: RouteOptimizationInput,
    optimizationResult: RouteOptimizationResult,
  ) {
    // 기존 배송지 마커 제거 (인덱스 1부터 = 배송지 마커)
    markersRef.current.slice(1).forEach((m) => m.remove())
    markersRef.current = [markersRef.current[0]] // 출발지만 유지

    // 최적화된 순서대로 마커 다시 추가 (초록색)
    optimizationResult.optimizedOrder.forEach((wp) => {
      const dest = data.destinations.find(
        (d) => d.destinationId === wp.destinationId,
      )
      if (!dest) return
      const el = document.createElement('div')
      el.className = 'route-dest-marker route-dest-after'
      const label = truncateAddressToDistrict(dest.address) || dest.name || dest.destinationId
      el.innerHTML = `<svg class="route-dest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V21H3z"/><path d="M9 21V12h6v9"/></svg><span class="route-dest-seq">${wp.optimizedSequence}</span><span class="route-dest-label">${label}</span>`
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([dest.longitude, dest.latitude])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }

  // ─── 렌더링 ───

  const isLoading = status === 'loading-input' || status === 'loading-optimize'
  const statusMessage =
    status === 'loading-input'
      ? '경로 입력 데이터 불러오는 중...'
      : status === 'loading-optimize'
        ? '경로 최적화 실행 중...'
        : null

  // 지도 중심: 입력 데이터가 있으면 출발지, 없으면 한국 남동부 중심
  const mapCenter: [number, number] = input
    ? [input.startLocation.longitude, input.startLocation.latitude]
    : [128.9, 35.3]

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>최적화 경로 조회</h1>
          <p>
            {filterOptionName
              ? `AI 추천: ${filterOptionName} (${filterDeliveryIds?.length ?? 0}건 필터)`
              : 'Amazon Location Service OptimizeWaypoints + CalculateRoutes'}
          </p>
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            배송 차량 ID
            <input
              type="text"
              value={vehicleIdInput}
              onChange={(e) => setVehicleIdInput(e.target.value)}
              placeholder="예: VEH038"
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '14px',
                width: '160px',
              }}
              disabled={isLoading}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
            출발 Hub
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
              }}
              disabled={isLoading}
            >
              {hubs.map((hub) => (
                <option key={hub.hubId} value={hub.hubId}>
                  {hub.name} ({hub.hubId})
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn-primary"
            onClick={handleFetchAndOptimize}
            disabled={isLoading}
          >
            {isLoading ? (statusMessage ?? '처리 중...') : '경로 최적화 실행'}
          </button>
        </div>
        {/* FM 옵션 필터 바 */}
        {fmOptions.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginRight: '4px' }}>필터:</span>
            <button
              className={`btn btn-sm${!filterDeliveryIds ? ' btn-primary' : ''}`}
              onClick={handleReset}
              disabled={isLoading}
            >
              전체 배송지
            </button>
            {fmOptions.map((opt, idx) => (
              <button
                key={idx}
                className={`btn btn-sm${filterOptionName === opt.name ? ' btn-primary' : ''}`}
                onClick={() => handleSelectOption(opt)}
                disabled={isLoading}
              >
                {opt.name} ({opt.deliveries.length}건)
              </button>
            ))}
          </div>
        )}
        {/* FM 옵션이 없고 필터가 적용된 경우 (직접 전달된 경우) */}
        {fmOptions.length === 0 && filterDeliveryIds && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-primary-600)' }}>
              AI 추천 필터: {filterOptionName ?? '선택됨'} ({filterDeliveryIds.length}건)
            </span>
            <button
              className="btn btn-sm"
              onClick={handleReset}
              disabled={isLoading}
            >
              전체 배송지 조회
            </button>
          </div>
        )}
        {user && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            로그인: {user.name} ({user.employeeId})
            {user.hubId && ` | 소속 허브: ${user.hubId}`}
            {user.assignedVehicleId && ` | 배정 차량: ${user.assignedVehicleId}`}
          </p>
        )}
      </div>

      {/* 지도 영역 */}
      <div className="card">
        <div className="card-header">
          <h2>배송 경로 지도</h2>
          <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {selectedVehicleId
              ? `차량: ${selectedVehicleId} | `
              : ''}
            파란색 마커: 원래 순서 | 초록색 마커: 최적화된 순서
          </span>
        </div>
        <AmazonMap
          className="map-full"
          center={mapCenter}
          zoom={10}
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
      {result && input && (
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
                      <td>{truncateAddressToDistrict(dest?.address) || dest?.name || wp.destinationId}</td>
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
      {input && (
        <div className="card">
          <div className="card-header">
            <h2>입력 데이터 조회</h2>
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
              배송지 {input.destinations.length}건
            </span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>배송지 ID</th>
                  <th>위도</th>
                  <th>경도</th>
                </tr>
              </thead>
              <tbody>
                {input.destinations.map((dest, idx) => (
                  <tr key={dest.destinationId}>
                    <td>{dest.plannedSequence ?? idx + 1}</td>
                    <td>{truncateAddressToDistrict(dest.address) || dest.name || dest.destinationId}</td>
                    <td>{dest.latitude.toFixed(4)}</td>
                    <td>{dest.longitude.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
