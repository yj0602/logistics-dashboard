import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { UserRole } from '../../types/auth'
import type { Hub, MapPoint } from '../../types/hub'
import type { VehicleStatus, VehicleWithEta } from '../../types/vehicle'
import { AmazonMap } from '../map/AmazonMap'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'

interface VehicleMapProps {
  vehicles: VehicleWithEta[]
  hubs: Hub[]
  compact?: boolean
  role?: UserRole
  employeeHubId?: string
}

type StatusFilter = 'ALL' | VehicleStatus

const statusFilterLabels: Record<StatusFilter, string> = {
  ALL: '전체',
  ARRIVED: '도착',
  IN_TRANSIT: '운행 중',
  DELAYED: '지연',
}

const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  IN_TRANSIT: 'var(--blue-600)',
  DELAYED: 'var(--red-600)',
  ARRIVED: 'var(--green-600)',
}

function hasValidMapPoint(point: MapPoint | null | undefined): point is MapPoint {
  return (
    typeof point?.lat === 'number' &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180
  )
}

function getHubName(hubs: Hub[], hubId: string) {
  return hubs.find((hub) => hub.hubId === hubId)?.name ?? hubId
}

function isApproaching(vehicle: VehicleWithEta) {
  return vehicle.status === 'IN_TRANSIT' && vehicle.remainingDistanceKm <= 20
}

function createHubMarkerElement(
  name: string,
  isSelected: boolean,
  arrivedVehicleIds: string[],
): HTMLElement {
  const el = document.createElement('div')
  el.className = `maplibre-hub-marker${isSelected ? ' is-selected' : ''}${arrivedVehicleIds.length > 0 ? ' has-arrived' : ''}`
  if (arrivedVehicleIds.length > 0) {
    el.setAttribute('data-arrived-count', String(arrivedVehicleIds.length))
  }
  el.innerHTML = `<span>H</span><strong>${name}</strong>`
  return el
}

function createVehicleMarkerElement(
  vehicle: VehicleWithEta,
  isSelected: boolean,
  compact: boolean,
): HTMLElement {
  const el = document.createElement('button')
  el.className = `maplibre-vehicle-marker marker-${vehicle.status.toLowerCase()}${isSelected ? ' is-selected' : ''}`
  el.type = 'button'

  const approaching = !compact && isApproaching(vehicle)
  el.innerHTML = `<span>${vehicle.vehicleId}${approaching ? '<small class="marker-sub-label">임박</small>' : ''}</span>`
  return el
}

export function VehicleMap({
  vehicles,
  hubs,
  compact = false,
  role = 'ADMIN',
  employeeHubId = 'HUB074',
}: VehicleMapProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedHubId, setSelectedHubId] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL')
  const [delayedOnly, setDelayedOnly] = useState(false)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const vehicleListRef = useRef<HTMLDivElement | null>(null)
  // Track whether vehicle selection came from the list (to trigger flyTo)
  const selectionSourceRef = useRef<'list' | 'map' | 'init'>('init')

  const hubScopedVehicles = useMemo(() => {
    if (role === 'EMPLOYEE') {
      return vehicles.filter((vehicle) => vehicle.destinationHubId === employeeHubId)
    }

    return selectedHubId === 'ALL'
      ? vehicles
      : vehicles.filter((vehicle) => vehicle.destinationHubId === selectedHubId)
  }, [employeeHubId, role, selectedHubId, vehicles])

  const filteredVehicles = useMemo(() => {
    return hubScopedVehicles.filter((vehicle) => {
      const matchesStatus =
        selectedStatus === 'ALL' || vehicle.status === selectedStatus
      const matchesDelayed = !delayedOnly || vehicle.status === 'DELAYED'

      return matchesStatus && matchesDelayed
    })
  }, [delayedOnly, hubScopedVehicles, selectedStatus])

  const selectedVehicle = useMemo(
    () =>
      selectedVehicleId
        ? filteredVehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? undefined
        : undefined,
    [filteredVehicles, selectedVehicleId],
  )
  const lastVehicleId = useMemo(() => {
    const etaVehicles = hubScopedVehicles
      .filter((vehicle) => vehicle.eta.estimatedArrivalTime)
      .sort((a, b) =>
        String(b.eta.estimatedArrivalTime).localeCompare(
          String(a.eta.estimatedArrivalTime),
        ),
      )

    return etaVehicles[0]?.vehicleId
  }, [hubScopedVehicles])
  const visibleHubs = useMemo(() => {
    if (role === 'EMPLOYEE') {
      return hubs.filter((hub) => hub.hubId === employeeHubId)
    }

    return selectedHubId === 'ALL'
      ? hubs
      : hubs.filter((hub) => hub.hubId === selectedHubId)
  }, [employeeHubId, hubs, role, selectedHubId])
  const statusFilters: StatusFilter[] = ['ALL', 'IN_TRANSIT', 'DELAYED', 'ARRIVED']

  // Sync markers with map
  const displayVehicles = compact ? vehicles : filteredVehicles
  const mappableVehicles = useMemo(
    () => displayVehicles.filter((vehicle) => hasValidMapPoint(vehicle.currentLocation)),
    [displayVehicles],
  )
  const mappableHubs = useMemo(
    () => visibleHubs.filter((hub) => hasValidMapPoint(hub.location)),
    [visibleHubs],
  )

  // Handle vehicle selection from the list → fly to vehicle on map (toggle if already selected)
  const handleVehicleSelectFromList = useCallback((vehicleId: string) => {
    selectionSourceRef.current = 'list'
    setSelectedVehicleId((prev) => (prev === vehicleId ? '' : vehicleId))
  }, [])

  // Handle vehicle selection from map marker → scroll list into view
  const handleVehicleSelectFromMap = useCallback((vehicleId: string) => {
    selectionSourceRef.current = 'map'
    setSelectedVehicleId(vehicleId)
  }, [])

  // Handle hub selection from map marker
  const handleHubSelectFromMap = useCallback((hubId: string) => {
    setSelectedHubId((prev) => (prev === hubId ? 'ALL' : hubId))
  }, [])

  // Fly to selected vehicle when selected from the list
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady || compact) return
    if (selectionSourceRef.current !== 'list') return

    const vehicle = filteredVehicles.find(
      (v) => v.vehicleId === selectedVehicleId,
    )
    if (!vehicle || !hasValidMapPoint(vehicle.currentLocation)) return

    map.flyTo({
      center: [vehicle.currentLocation.lng, vehicle.currentLocation.lat],
      zoom: Math.max(map.getZoom(), 9),
      duration: 600,
    })
  }, [selectedVehicleId, filteredVehicles, mapReady, compact])

  // Auto-scroll vehicle list when selected from map
  useEffect(() => {
    if (selectionSourceRef.current !== 'map') return
    if (!vehicleListRef.current) return

    const listEl = vehicleListRef.current
    const selectedEl = listEl.querySelector(
      `[data-vehicle-id="${selectedVehicleId}"]`,
    ) as HTMLElement | null

    if (selectedEl) {
      selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedVehicleId])

  // Fit map bounds: center on employee hub, or fit all hubs for admin
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    if (role === 'EMPLOYEE') {
      const hub = hubs.find((h) => h.hubId === employeeHubId)
      if (hub && hasValidMapPoint(hub.location)) {
        map.setCenter([hub.location.lng, hub.location.lat])
        map.setZoom(compact ? 100 : 11)
      }
    } else {
      if (!compact) return
      if (mappableHubs.length === 0) {
        map.setCenter([128.74, 35.60])
        map.setZoom(9)
      } else if (mappableHubs.length === 1) {
        const hub = mappableHubs[0]
        map.setCenter([hub.location.lng, hub.location.lat])
        map.setZoom(10)
      } else {
        const bounds = new maplibregl.LngLatBounds()
        for (const hub of mappableHubs) {
          bounds.extend([hub.location.lng, hub.location.lat])
        }
        map.fitBounds(bounds, {
          padding: 40,
          maxZoom: 10,
          animate: false,
        })
      }
    }
  }, [compact, role, employeeHubId, hubs, mappableHubs, mapReady])

  // Render markers on map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    // Clear existing markers
    for (const marker of markersRef.current) {
      marker.remove()
    }
    markersRef.current = []

    // Add hub markers (clickable in non-compact mode for admin)
    for (const hub of mappableHubs) {
      const isHubSelected = selectedHubId === hub.hubId
      const arrivedAtHub = vehicles
        .filter((v) => v.destinationHubId === hub.hubId && v.status === 'ARRIVED')
        .map((v) => v.vehicleId)
      const el = createHubMarkerElement(hub.name, isHubSelected, arrivedAtHub)
      if (!compact && role === 'ADMIN') {
        el.style.cursor = 'pointer'
        el.addEventListener('click', () => {
          handleHubSelectFromMap(hub.hubId)
        })
      }

      // Popup for arrived vehicles on hover
      let popup: maplibregl.Popup | null = null
      if (arrivedAtHub.length > 0) {
        const popupHtml = `<div class="hub-popup"><strong class="hub-popup-title">도착 차량 (${arrivedAtHub.length})</strong>${arrivedAtHub.map((id) => `<div class="hub-popup-item">${id}</div>`).join('')}</div>`
        popup = new maplibregl.Popup({ offset: 10, closeButton: false, closeOnClick: false })
          .setHTML(popupHtml)

        el.addEventListener('mouseenter', () => {
          popup!.setLngLat([hub.location.lng, hub.location.lat]).addTo(map)
        })
        el.addEventListener('mouseleave', () => {
          popup!.remove()
        })
      }

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hub.location.lng, hub.location.lat])
        .addTo(map)
      markersRef.current.push(marker)
    }

    // Add vehicle markers
    for (const vehicle of mappableVehicles) {
      const isSelected = vehicle.vehicleId === selectedVehicle?.vehicleId
      const el = createVehicleMarkerElement(vehicle, isSelected, compact)
      el.addEventListener('click', () => {
        handleVehicleSelectFromMap(vehicle.vehicleId)
      })
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([vehicle.currentLocation.lng, vehicle.currentLocation.lat])
        .addTo(map)
      markersRef.current.push(marker)
    }

    // Draw route for selected vehicle (non-compact only)
    const selectedRoute = selectedVehicle?.route.filter(hasValidMapPoint) ?? []

    if (!compact && selectedVehicle && selectedRoute.length >= 2) {
      const routeSourceId = 'selected-route'
      if (map.getSource(routeSourceId)) {
        map.removeLayer(`${routeSourceId}-line`)
        map.removeSource(routeSourceId)
      }
      const coordinates = selectedRoute.map((point) => [point.lng, point.lat])
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      })
      map.addLayer({
        id: `${routeSourceId}-line`,
        type: 'line',
        source: routeSourceId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': VEHICLE_STATUS_COLORS[selectedVehicle.status],
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      })
    }

    return () => {
      if (map.getStyle()) {
        const routeSourceId = 'selected-route'
        try {
          if (map.getLayer(`${routeSourceId}-line`)) {
            map.removeLayer(`${routeSourceId}-line`)
          }
          if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId)
          }
        } catch {
          // Map may already be removed
        }
      }
    }
  }, [mappableHubs, mappableVehicles, selectedVehicle, selectedHubId, compact, mapReady, role, handleHubSelectFromMap, handleVehicleSelectFromMap])

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map
    setMapReady(true)
  }, [])

  if (vehicles.length === 0) {
    return (
      <Card title="차량 위치 지도">
        <div className="empty-state">현재 조회 가능한 차량이 없습니다.</div>
      </Card>
    )
  }

  return (
    <div className={compact ? 'map-preview' : 'vehicle-monitoring-layout'}>
      {!compact && (
        <Card
          className="vehicle-list-panel"
          title={role === 'ADMIN' ? '차량 / 운행 정보' : '내 Hub 차량 정보'}
        >
          <div className="map-scope-summary">
            {role === 'ADMIN' ? (
              <>
                <strong>전체 물류 현황</strong>
                <span>전체 {hubScopedVehicles.length}대</span>
                <span>
                  지연{' '}
                  {
                    hubScopedVehicles.filter(
                      (vehicle) => vehicle.status === 'DELAYED',
                    ).length
                  }
                  대
                </span>
                <span>{isApproachingSummary(hubScopedVehicles)}대 도착 임박</span>
              </>
            ) : (
              <>
                <strong>{getHubName(hubs, employeeHubId)}</strong>
                <span>도착 예정 {hubScopedVehicles.length}대</span>
                <span>막차 ETA {selectedVehicle?.eta.estimatedArrivalTime ?? '-'}</span>
                <span>
                  지연{' '}
                  {
                    hubScopedVehicles.filter(
                      (vehicle) => vehicle.status === 'DELAYED',
                    ).length
                  }
                  대
                </span>
              </>
            )}
          </div>

          <div className="filter-stack">
            {role === 'ADMIN' && (
              <label className="filter-label">
                Hub
                <select
                  onChange={(event) => setSelectedHubId(event.target.value)}
                  value={selectedHubId}
                >
                  <option value="ALL">전체 Hub</option>
                  {hubs.map((hub) => (
                    <option key={hub.hubId} value={hub.hubId}>
                      {hub.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="filter-chip-group" aria-label="차량 상태 필터">
              {statusFilters.map((status) => (
                <button
                  className={`filter-chip ${
                    selectedStatus === status ? 'is-active' : ''
                  }`}
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  type="button"
                >
                  {statusFilterLabels[status]} (
                  {status === 'ALL'
                    ? hubScopedVehicles.length
                    : hubScopedVehicles.filter((vehicle) => vehicle.status === status)
                        .length}
                  )
                </button>
              ))}
            </div>
            <label className="filter-toggle">
              <input
                checked={delayedOnly}
                onChange={(event) => setDelayedOnly(event.target.checked)}
                type="checkbox"
              />
              지연 차량만 보기
            </label>
          </div>
          <div className="vehicle-list" ref={vehicleListRef}>
            {filteredVehicles.length === 0 ? (
              <div className="empty-state map-empty">조건에 맞는 차량이 없습니다.</div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <button
                  className={`vehicle-list-item ${
                    vehicle.vehicleId === selectedVehicle?.vehicleId
                      ? 'is-selected'
                      : ''
                  }`}
                  data-vehicle-id={vehicle.vehicleId}
                  key={vehicle.vehicleId}
                  onClick={() => handleVehicleSelectFromList(vehicle.vehicleId)}
                  type="button"
                >
                  <span>
                    {vehicle.vehicleId}
                    {vehicle.vehicleId === lastVehicleId && (
                      <em className="last-vehicle-badge">막차</em>
                    )}
                  </span>
                  <StatusBadge status={vehicle.status} />
                  <small>{getHubName(hubs, vehicle.destinationHubId)}</small>
                  <small>
                    ETA {vehicle.eta.estimatedArrivalTime ?? '-'}
                    {vehicle.eta.delayMinutes > 0 &&
                      ` · ${vehicle.eta.delayMinutes}분 지연`}
                  </small>
                </button>
              ))
            )}
          </div>
        </Card>
      )}

      <Card className="map-card" title={compact ? undefined : '실시간 차량 위치'}>
        <AmazonMap
          className={compact ? 'map-compact' : 'map-full'}
          center={[128.74, 35.60]}
          zoom={compact ? 6.5 : 9}
          interactive={!compact}
          navigationControl={!compact}
          onMapReady={handleMapReady}
        >
          <div className="map-legend">
            <span className="legend-item legend-in-transit">운행 중</span>
            <span className="legend-item legend-delayed">지연</span>
            <span className="legend-item legend-arrived">도착</span>
            <span className="legend-item legend-hub">Hub</span>
          </div>
        </AmazonMap>
      </Card>

      {!compact && selectedVehicle && (
        <Card className="vehicle-detail-panel" title="차량 상세 정보">
          <div className="detail-vehicle-id">
            <span className={`detail-marker marker-${selectedVehicle.status.toLowerCase()}`} />
            <div>
              <h2>{selectedVehicle.vehicleId}</h2>
              <StatusBadge status={selectedVehicle.status} />
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>출발 Hub</dt>
              <dd>{getHubName(hubs, selectedVehicle.departureHubId)}</dd>
            </div>
            <div>
              <dt>도착 Hub</dt>
              <dd>{getHubName(hubs, selectedVehicle.destinationHubId)}</dd>
            </div>
            <div>
              <dt>현재 위치</dt>
              <dd>{selectedVehicle.currentRoad}</dd>
            </div>
            <div>
              <dt>ETA</dt>
              <dd>{selectedVehicle.eta.estimatedArrivalTime ?? '-'}</dd>
            </div>
            <div>
              <dt>지연 시간</dt>
              <dd>
                {selectedVehicle.eta.delayMinutes > 0
                  ? `${selectedVehicle.eta.delayMinutes}분`
                  : '-'}
              </dd>
            </div>
            <div>
              <dt>남은 거리</dt>
              <dd>{selectedVehicle.remainingDistanceKm} km</dd>
            </div>
            <div>
              <dt>위치 갱신</dt>
              <dd>{selectedVehicle.locationUpdatedAt}</dd>
            </div>
            <div>
              <dt>예측 갱신</dt>
              <dd>{selectedVehicle.eta.predictionUpdatedAt}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}

function isApproachingSummary(vehicles: VehicleWithEta[]) {
  return vehicles.filter(isApproaching).length
}
