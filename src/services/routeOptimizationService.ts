import type {
  RouteOptimizationInput,
  RouteOptimizationResult,
  OptimizedWaypoint,
  RouteGeometry,
} from '../types/routeOptimization'

const REGION = import.meta.env.VITE_AWS_REGION
const API_KEY = import.meta.env.VITE_AMAZON_LOCATION_API_KEY

function getBaseUrl(): string {
  return `https://routes.geo.${REGION}.amazonaws.com`
}

/** Amazon Location Service OptimizeWaypoints API 제약사항 */
const MAX_WAYPOINTS = 50
const SERVICE_DURATION_MAX_WAYPOINTS = 20

/**
 * Amazon Location Service OptimizeWaypoints API 호출
 * 배송지 방문 순서를 최적화한다.
 *
 * API 제약:
 * - Waypoints 최대 50개
 * - 20개 초과 시 ServiceDuration 등 부가 옵션 사용 불가
 *
 * 배송지가 50개를 초과하면 처음 50개만 최적화한다.
 */
export async function optimizeWaypoints(
  input: RouteOptimizationInput,
): Promise<RouteOptimizationResult> {
  const url = `${getBaseUrl()}/v2/optimize-waypoints?key=${API_KEY}`

  const optimizeFor =
    input.optimizationMode === 'SHORTEST' ? 'ShortestRoute' : 'FastestRoute'

  // 50개 초과 시 앞에서 50개만 사용
  const destinations = input.destinations.slice(0, MAX_WAYPOINTS)
  const waypointCount = destinations.length
  const useServiceDuration = waypointCount <= SERVICE_DURATION_MAX_WAYPOINTS

  if (input.destinations.length > MAX_WAYPOINTS) {
    console.warn(
      `[RouteOptimization] 배송지 ${input.destinations.length}개 중 ${MAX_WAYPOINTS}개만 최적화합니다 (API 최대 제한).`,
    )
  }

  const body = {
    Origin: [input.startLocation.longitude, input.startLocation.latitude],
    OptimizeSequencingFor: optimizeFor,
    TravelMode: 'Car',
    DepartNow: true,
    Waypoints: destinations.map((dest) => {
      const waypoint: { Id: string; Position: [number, number]; ServiceDuration?: number } = {
        Id: dest.destinationId,
        Position: [dest.longitude, dest.latitude],
      }
      // 20개 초과 시 ServiceDuration 사용 불가
      if (useServiceDuration && dest.serviceTimeMinutes != null && dest.serviceTimeMinutes > 0) {
        waypoint.ServiceDuration = dest.serviceTimeMinutes * 60
      }
      return waypoint
    }),
  }

  console.log('[RouteOptimization] OptimizeWaypoints request:', JSON.stringify(body, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[RouteOptimization] OptimizeWaypoints error:', response.status, errorText)
    throw new Error(`OptimizeWaypoints failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('[RouteOptimization] OptimizeWaypoints response:', JSON.stringify(data, null, 2))

  const optimizedOrder: OptimizedWaypoint[] = (data.OptimizedWaypoints ?? []).map(
    (wp: { Id: string; Position: number[] }, index: number) => {
      const originalDest = destinations.find((d) => d.destinationId === wp.Id)
      return {
        destinationId: wp.Id,
        optimizedSequence: index + 1,
        originalSequence: originalDest?.plannedSequence ?? null,
      }
    },
  )

  return {
    optimizedOrder,
    totalDistanceMeters: data.Distance ?? 0,
    totalDurationSeconds: data.Duration ?? 0,
  }
}

/** CalculateRoutes API Waypoints 최대 개수 */
const MAX_ROUTE_WAYPOINTS = 23

/**
 * Amazon Location Service CalculateRoutes API 호출
 * 최적화된 순서의 좌표를 연결하는 실제 도로 경로를 계산한다.
 *
 * API 제약: 중간 Waypoints 최대 23개 (Origin, Destination 제외)
 * 포인트가 25개(origin+23waypoints+destination)를 초과하면
 * 여러 구간으로 나눠서 호출 후 결과를 이어붙인다.
 */
export async function calculateRoute(
  orderedPositions: [number, number][], // [lon, lat] 순서
): Promise<RouteGeometry> {
  if (orderedPositions.length < 2) {
    throw new Error('CalculateRoutes requires at least 2 positions (origin + destination)')
  }

  // 한 번에 호출 가능한 최대 포인트 수: origin(1) + waypoints(23) + destination(1) = 25
  const maxPointsPerCall = MAX_ROUTE_WAYPOINTS + 2 // 25

  if (orderedPositions.length <= maxPointsPerCall) {
    return calculateRouteSingle(orderedPositions)
  }

  // 여러 구간으로 분할
  const allCoordinates: [number, number][] = []
  let startIdx = 0

  while (startIdx < orderedPositions.length - 1) {
    // 이번 구간의 끝 인덱스 (최대 25개 포인트)
    const endIdx = Math.min(startIdx + maxPointsPerCall - 1, orderedPositions.length - 1)
    const segment = orderedPositions.slice(startIdx, endIdx + 1)

    const segmentResult = await calculateRouteSingle(segment)
    allCoordinates.push(...segmentResult.coordinates)

    // 다음 구간은 이번 구간의 마지막 포인트부터 시작 (연속성 유지)
    startIdx = endIdx
  }

  return { coordinates: allCoordinates }
}

/**
 * 단일 CalculateRoutes API 호출 (포인트 25개 이하)
 */
async function calculateRouteSingle(
  orderedPositions: [number, number][],
): Promise<RouteGeometry> {
  const url = `${getBaseUrl()}/v2/routes?key=${API_KEY}`

  const origin = orderedPositions[0]
  const destination = orderedPositions[orderedPositions.length - 1]
  const waypoints = orderedPositions.slice(1, -1).map((pos) => ({
    Position: pos,
  }))

  const body: Record<string, unknown> = {
    Origin: origin,
    Destination: destination,
    TravelMode: 'Car',
    LegGeometryFormat: 'Simple',
    DepartNow: true,
  }

  if (waypoints.length > 0) {
    body.Waypoints = waypoints
  }

  console.log('[RouteOptimization] CalculateRoutes request:', JSON.stringify(body, null, 2))

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[RouteOptimization] CalculateRoutes error:', response.status, errorText)
    throw new Error(`CalculateRoutes failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('[RouteOptimization] CalculateRoutes response (summary):', {
    routeCount: data.Routes?.length,
    legCount: data.Routes?.[0]?.Legs?.length,
  })

  // 모든 Leg의 Geometry.LineString을 합쳐서 전체 경로 좌표를 반환
  const coordinates: [number, number][] = []

  if (data.Routes && data.Routes.length > 0) {
    const route = data.Routes[0]
    for (const leg of route.Legs ?? []) {
      const lineString: number[][] = leg.Geometry?.LineString ?? []
      for (const coord of lineString) {
        coordinates.push([coord[0], coord[1]])
      }
    }
  }

  return { coordinates }
}

/**
 * 전체 워크플로우:
 * 1. OptimizeWaypoints로 최적 순서 결정
 * 2. 최적 순서의 좌표를 CalculateRoutes에 전달하여 도로 경로 계산
 */
export async function optimizeAndCalculateRoute(
  input: RouteOptimizationInput,
): Promise<{
  optimizationResult: RouteOptimizationResult
  routeGeometry: RouteGeometry
}> {
  // 1단계: 방문 순서 최적화
  const optimizationResult = await optimizeWaypoints(input)

  // 2단계: 최적화된 순서대로 좌표 배열 구성 (출발지 포함)
  const orderedPositions: [number, number][] = [
    [input.startLocation.longitude, input.startLocation.latitude],
  ]

  for (const wp of optimizationResult.optimizedOrder) {
    const dest = input.destinations.find((d) => d.destinationId === wp.destinationId)
    if (dest) {
      orderedPositions.push([dest.longitude, dest.latitude])
    }
  }

  // 3단계: 도로 경로 계산
  const routeGeometry = await calculateRoute(orderedPositions)

  return { optimizationResult, routeGeometry }
}
