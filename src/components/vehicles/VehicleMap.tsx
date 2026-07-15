import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useVehicleAnimation } from '../../hooks/useVehicleAnimation'
import type { AnimatedVehicleState } from '../../hooks/useVehicleAnimation'
import type { UserRole } from '../../types/auth'
import type { Hub, MapPoint } from '../../types/hub'
import type { VehicleStatus, VehicleWithEta } from '../../types/vehicle'
import { calculateBearing as computeBearing } from '../../utils/mapUtils'
import { AmazonMap } from '../map/AmazonMap'
import { Card } from '../ui/Card'
import { StatusBadge } from '../ui/StatusBadge'

interface VehicleMapProps {
  vehicles: VehicleWithEta[]
  hubs: Hub[]
  compact?: boolean
  role?: UserRole
  employeeHubId?: string
  initialVehicleId?: string
  initialHubId?: string
  initialRegion?: string
  onHubClick?: (hubId: string) => void
  onRegionClick?: (region: string) => void
  onVehicleClick?: (vehicleId: string) => void
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

/** 창고 아이콘 SVG (hub marker용) */
const HUB_ICON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V9l9-6 9 6v12"/><path d="M9 21V12h6v9"/></svg>`

/** 트럭 아이콘 SVG (vehicle marker용 — 정차 차량) */
const VEHICLE_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`

/** 방향 화살표 SVG (이동 중 차량용) — 위(북)를 가리키며 bearing으로 회전 */
const VEHICLE_DIRECTION_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2 L18 14 L12 11 L6 14 Z"/></svg>`

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

  el.innerHTML = `
    <div class="marker-pin">${HUB_ICON_SVG}</div>
    <div class="marker-label">
      <span class="marker-name">${name}</span>
      ${badgesHtml ? `<div class="hub-badges">${badgesHtml}</div>` : ''}
    </div>
  `
  return el
}

function createVehicleMarkerElement(
  vehicle: VehicleWithEta,
  isSelected: boolean,
  compact: boolean,
  animState?: AnimatedVehicleState | null,
): HTMLElement {
  const el = document.createElement('button')
  const isMoving = animState?.isMoving ?? vehicle.speedKmh > 0
  el.className = `maplibre-vehicle-marker marker-${vehicle.status.toLowerCase()}${isSelected ? ' is-selected' : ''}${isMoving ? ' is-moving' : ''}`
  el.type = 'button'

  const approaching = !compact && isApproaching(vehicle)

  if (isMoving && animState?.bearing != null) {
    // Directional arrow marker for moving vehicles
    el.innerHTML = `
      <div class="marker-pin marker-directional" style="transform: rotate(${animState.bearing}deg)">${VEHICLE_DIRECTION_SVG}</div>
      <span class="marker-label">${vehicle.vehicleId}${approaching ? ' <small class="marker-sub-label">임박</small>' : ''}</span>
    `
  } else {
    // Static truck icon for stationary vehicles
    el.innerHTML = `
      <div class="marker-pin">${VEHICLE_ICON_SVG}</div>
      <span class="marker-label">${vehicle.vehicleId}${approaching ? ' <small class="marker-sub-label">임박</small>' : ''}</span>
    `
  }
  return el
}

// ─── Main Component ───

/** Compute initial animation state for a vehicle using its route data */
function getInitialAnimState(vehicle: VehicleWithEta): AnimatedVehicleState | null {
  if (vehicle.speedKmh === 0) return null

  // Try to derive bearing from route: find a previous waypoint
  const route = vehicle.route
  const loc = vehicle.currentLocation
  if (route.length >= 2) {
    // Use the first route point (departure) as the "from" for bearing calculation
    const fromPoint = route[0]
    if (fromPoint && loc) {
      const bearing = computeBearing(
        { lat: fromPoint.lat, lng: fromPoint.lng },
        { lat: loc.lat, lng: loc.lng },
      )
      return {
        vehicleId: vehicle.vehicleId,
        displayLat: loc.lat,
        displayLng: loc.lng,
        targetLat: loc.lat,
        targetLng: loc.lng,
        bearing,
        isMoving: true,
      }
    }
  }

  return {
    vehicleId: vehicle.vehicleId,
    displayLat: loc.lat,
    displayLng: loc.lng,
    targetLat: loc.lat,
    targetLng: loc.lng,
    bearing: null,
    isMoving: true,
  }
}

export function VehicleMap({
  vehicles,
  hubs,
  compact = false,
  role = 'ADMIN',
  employeeHubId = '',
  initialVehicleId,
  initialHubId,
  initialRegion,
  onHubClick,
  onRegionClick,
  onVehicleClick,
}: VehicleMapProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId ?? '')
  const [selectedHubId, setSelectedHubId] = useState(initialHubId ?? 'ALL')
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL')

  const [zoomLevel, setZoomLevel] = useState(compact ? 6.5 : 9)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const vehicleMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const vehicleListRef = useRef<HTMLDivElement | null>(null)
  const selectionSourceRef = useRef<'list' | 'map' | 'init'>('init')

  // Vehicle animation: direction + smooth interpolation (only in full map mode)
  const animationEnabled = !compact && mapReady
  const handleAnimationFrame = useCallback((states: Map<string, AnimatedVehicleState>) => {
    const markers = vehicleMarkersRef.current
    for (const [vehicleId, state] of states) {
      const marker = markers.get(vehicleId)
      if (!marker) continue
      if (state.isMoving) {
        marker.setLngLat([state.displayLng, state.displayLat])
      }
    }
  }, [])

  useVehicleAnimation(vehicles, animationEnabled, handleAnimationFrame)

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

      return matchesStatus
    })
  }, [hubScopedVehicles, selectedStatus])

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
  // Only runs once after map is first ready (not on data refresh)
  const initialBoundsSetRef = useRef(false)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady) return
    if (initialBoundsSetRef.current) return
    initialBoundsSetRef.current = true

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

  // Fly to initial vehicle or hub from query params
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReady || compact) return

    if (initialVehicleId) {
      const vehicle = vehicles.find((v) => v.vehicleId === initialVehicleId)
      if (vehicle?.currentLocation) {
        selectionSourceRef.current = 'list'
        map.flyTo({
          center: [vehicle.currentLocation.lng, vehicle.currentLocation.lat],
          zoom: 12,
          duration: 800,
        })
      }
    } else if (initialRegion) {
      const regionHubs = hubs.filter((h) => h.region === initialRegion && h.location)
      if (regionHubs.length === 1) {
        map.flyTo({
          center: [regionHubs[0].location.lng, regionHubs[0].location.lat],
          zoom: 11,
          duration: 800,
        })
      } else if (regionHubs.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        for (const hub of regionHubs) {
          bounds.extend([hub.location.lng, hub.location.lat])
        }
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 12,
          duration: 800,
        })
      }
    } else if (initialHubId) {
      const hub = hubs.find((h) => h.hubId === initialHubId)
      if (hub?.location) {
        map.flyTo({
          center: [hub.location.lng, hub.location.lat],
          zoom: 12,
          duration: 800,
        })
      }
    }
    // Only run once when map becomes ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (compact && onRegionClick) {
          el.style.cursor = 'pointer'
          el.addEventListener('click', () => {
            onRegionClick(cluster.region)
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
        if (compact && onHubClick) {
          el.style.cursor = 'pointer'
          el.addEventListener('click', () => {
            onHubClick(hub.hubId)
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
        vehicleMarkersRef.current.clear()
        for (const vehicle of mappableVehicles) {
          const isSelected = vehicle.vehicleId === selectedVehicle?.vehicleId
          // Compute initial bearing from route (previous waypoint → current location)
          const animState = getInitialAnimState(vehicle)
          const el = createVehicleMarkerElement(vehicle, isSelected, compact, animState)
          el.addEventListener('click', () => {
            handleVehicleSelectFromMap(vehicle.vehicleId)
          })
          const marker = new maplibregl.Marker({ element: el, rotationAlignment: 'map' })
            .setLngLat([vehicle.currentLocation.lng, vehicle.currentLocation.lat])
            .addTo(map)
          markersRef.current.push(marker)
          vehicleMarkersRef.current.set(vehicle.vehicleId, marker)
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
  }, [mappableHubs, mappableVehicles, selectedVehicle, selectedHubId, compact, mapReady, role, showRegionClusters, regionClusters, handleHubSelectFromMap, handleVehicleSelectFromMap, handleRegionClick, vehicles, onHubClick, onRegionClick, onVehicleClick])

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
                  {vehicle.status !== 'ARRIVED' && (
                    <small>
                      ETA {vehicle.eta.estimatedArrivalTime ?? '-'}
                      {vehicle.eta.delayMinutes > 0 &&
                        ` · ${vehicle.eta.delayMinutes}분 지연`}
                    </small>
                  )}
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
            {selectedVehicle.status !== 'ARRIVED' && (
              <div>
                <dt>ETA</dt>
                <dd>{selectedVehicle.eta.estimatedArrivalTime ?? '-'}</dd>
              </div>
            )}
            <div>
              <dt>남은 거리</dt>
              <dd>{selectedVehicle.remainingDistanceKm} km</dd>
            </div>
            <div>
              <dt>위치 갱신</dt>
              <dd>{selectedVehicle.locationUpdatedAt}</dd>
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
