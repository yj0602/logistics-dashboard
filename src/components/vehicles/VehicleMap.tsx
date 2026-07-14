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

/** 줌 레벨 임계값: 이 값 이상이면 개별 허브 마커 표시, 미만이면 지역 클러스터 표시 */
const REGION_ZOOM_THRESHOLD = 10.5

// ─── Region Cluster Types ───

interface RegionCluster {
  region: string
  hubs: Hub[]
  center: { lat: number; lng: number }
  vehicleCounts: { arrived: number; inTransit: number; delayed: number }
}

// ─── Helper Functions ───

function hasValidMapPoint(point: MapPoint | null | undefined): point is MapPoint {
  return (
    typeof point?.lat === 'number' &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point?.lng === 'number' &&
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

function buildRegionClusters(hubs: Hub[], vehicles: VehicleWithEta[]): RegionCluster[] {
  const regionMap = new Map<string, Hub[]>()
  for (const hub of hubs) {
    if (!hasValidMapPoint(hub.location)) continue
    const existing = regionMap.get(hub.region) ?? []
    existing.push(hub)
    regionMap.set(hub.region, existing)
  }

  const clusters: RegionCluster[] = []
  for (const [region, regionHubs] of regionMap) {
    const avgLat = regionHubs.reduce((sum, h) => sum + h.location.lat, 0) / regionHubs.length
    const avgLng = regionHubs.reduce((sum, h) => sum + h.location.lng, 0) / regionHubs.length

    const hubIds = new Set(regionHubs.map((h) => h.hubId))
    const regionVehicles = vehicles.filter((v) => hubIds.has(v.destinationHubId))

    clusters.push({
      region,
      hubs: regionHubs,
      center: { lat: avgLat, lng: avgLng },
      vehicleCounts: {
        arrived: regionVehicles.filter((v) => v.status === 'ARRIVED').length,
        inTransit: regionVehicles.filter((v) => v.status === 'IN_TRANSIT').length,
        delayed: regionVehicles.filter((v) => v.status === 'DELAYED').length,
      },
    })
  }

  return clusters
}

// ─── Marker Element Creators ───

function createRegionClusterElement(cluster: RegionCluster, isCompact: boolean): HTMLElement {
  const el = document.createElement('div')
  el.className = `maplibre-region-cluster${isCompact ? ' is-compact' : ''}`

  const { arrived, inTransit, delayed } = cluster.vehicleCounts
  const totalVehicles = arrived + inTransit + delayed

  let badgesHtml = ''
  if (inTransit > 0) {
    badgesHtml += `<span class="region-badge badge-in-transit">${inTransit}</span>`
  }
  if (delayed > 0) {
    badgesHtml += `<span class="region-badge badge-delayed">${delayed}</span>`
  }
  if (arrived > 0) {
    badgesHtml += `<span class="region-badge badge-arrived">${arrived}</span>`
  }

  el.innerHTML = `
    <strong class="region-name">${cluster.region}</strong>
    <span class="region-hub-count">${cluster.hubs.length}개 Hub · ${totalVehicles}대</span>
    <div class="region-badges">${badgesHtml}</div>
  `
  return el
}

function createHubMarkerElement(
  name: string,
  isSelected: boolean,
  statusCounts: { arrived: number; inTransit: number; delayed: number },
  isCompact: boolean,
): HTMLElement {
  const el = document.createElement('div')
  const hasVehicles = statusCounts.arrived + statusCounts.inTransit + statusCounts.delayed > 0
  el.className = `maplibre-hub-marker${isSelected ? ' is-selected' : ''}${hasVehicles ? ' has-vehicles' : ''}${isCompact ? ' is-compact' : ''}`

  let badgesHtml = ''
  if (statusCounts.inTransit > 0) {
    badgesHtml += `<span class="hub-status-badge badge-in-transit">${statusCounts.inTransit}</span>`
  }
  if (statusCounts.delayed > 0) {
    badgesHtml += `<span class="hub-status-badge badge-delayed">${statusCounts.delayed}</span>`
  }
  if (statusCounts.arrived > 0) {
    badgesHtml += `<span class="hub-status-badge badge-arrived">${statusCounts.arrived}</span>`
  }

  el.innerHTML = `<span>H</span><strong>${name}</strong>${badgesHtml ? `<div class="hub-badges">${badgesHtml}</div>` : ''}`
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

// ─── Main Component ───

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
  const [zoomLevel, setZoomLevel] = useState(compact ? 6.5 : 9)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const vehicleListRef = useRef<HTMLDivElement | null>(null)
  const selectionSourceRef = useRef<'list' | 'map' | 'init'>('init')

  /** Whether we're in "zoomed out" mode showing region clusters (admin only) */
  const showRegionClusters = role === 'ADMIN' && !compact && zoomLevel < REGION_ZOOM_THRESHOLD

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

  // Region clusters for admin zoomed-out view (and compact mode)
  const regionClusters = useMemo(
    () => (role === 'ADMIN' ? buildRegionClusters(hubs, vehicles) : []),
    [hubs, vehicles, role],
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

  // Handle region cluster click → zoom into the region
  const handleRegionClick = useCallback((cluster: RegionCluster) => {
    const map = mapInstanceRef.current
    if (!map) return

    if (cluster.hubs.length === 1) {
      map.flyTo({
        center: [cluster.center.lng, cluster.center.lat],
        zoom: 12,
        duration: 600,
      })
    } else {
      const bounds = new maplibregl.LngLatBounds()
      for (const hub of cluster.hubs) {
        bounds.extend([hub.location.lng, hub.location.lat])
      }
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 12,
        duration: 600,
      })
    }
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
      zoom: Math.max(map.getZoom(), 11),
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
        map.setZoom(compact ? 12 : 11)
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

  // Track zoom level changes to toggle between region clusters and individual hubs
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    const handleZoom = () => {
      setZoomLevel(map.getZoom())
    }

    map.on('zoomend', handleZoom)
    return () => {
      map.off('zoomend', handleZoom)
    }
  }, [mapReady])

  // Render markers on map
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return

    // Clear existing markers
    for (const marker of markersRef.current) {
      marker.remove()
    }
    markersRef.current = []

    if (showRegionClusters || (compact && role === 'ADMIN')) {
      // ─── Region cluster mode (admin zoomed out or admin compact/dashboard) ───
      for (const cluster of regionClusters) {
        const el = createRegionClusterElement(cluster, compact)
        if (!compact) {
          el.style.cursor = 'pointer'
          el.addEventListener('click', () => {
            handleRegionClick(cluster)
          })
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cluster.center.lng, cluster.center.lat])
          .addTo(map)
        markersRef.current.push(marker)
      }
    } else {
      // ─── Individual hub mode (zoomed in, or employee, or employee compact) ───
      for (const hub of mappableHubs) {
        const isHubSelected = selectedHubId === hub.hubId
        const hubVehicles = vehicles.filter((v) => v.destinationHubId === hub.hubId)
        const statusCounts = {
          arrived: hubVehicles.filter((v) => v.status === 'ARRIVED').length,
          inTransit: hubVehicles.filter((v) => v.status === 'IN_TRANSIT').length,
          delayed: hubVehicles.filter((v) => v.status === 'DELAYED').length,
        }
        const el = createHubMarkerElement(hub.name, isHubSelected, statusCounts, compact && role === 'ADMIN')
        if (!compact && role === 'ADMIN') {
          el.style.cursor = 'pointer'
          el.addEventListener('click', () => {
            handleHubSelectFromMap(hub.hubId)
          })
        }

        // Popup for vehicles on hover
        const totalAtHub = statusCounts.arrived + statusCounts.inTransit + statusCounts.delayed
        if (totalAtHub > 0) {
          const hubVehiclesList = vehicles.filter((v) => v.destinationHubId === hub.hubId)
          const popupHtml = `<div class="hub-popup"><strong class="hub-popup-title">차량 (${totalAtHub})</strong>${hubVehiclesList.map((v) => `<div class="hub-popup-item hub-popup-${v.status.toLowerCase()}">${v.vehicleId}</div>`).join('')}</div>`
          const popup = new maplibregl.Popup({ offset: 10, closeButton: false, closeOnClick: false })
            .setHTML(popupHtml)

          el.addEventListener('mouseenter', () => {
            popup.setLngLat([hub.location.lng, hub.location.lat]).addTo(map)
          })
          el.addEventListener('mouseleave', () => {
            popup.remove()
          })
        }

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([hub.location.lng, hub.location.lat])
          .addTo(map)
        markersRef.current.push(marker)
      }

      // Add vehicle markers (only in full map mode when zoomed in)
      if (!compact && !showRegionClusters) {
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
      }
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
  }, [mappableHubs, mappableVehicles, selectedVehicle, selectedHubId, compact, mapReady, role, showRegionClusters, regionClusters, handleHubSelectFromMap, handleVehicleSelectFromMap, handleRegionClick, vehicles])

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
