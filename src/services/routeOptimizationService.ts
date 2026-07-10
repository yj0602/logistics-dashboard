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

/**
 * Amazon Location Service OptimizeWaypoints API 호출
 * 배송지 방문 순서를 최적화한다.
 */
export async function optimizeWaypoints(
  input: RouteOptimizationInput,
): Promise<RouteOptimizationResult> {
  const url = `${getBaseUrl()}/v2/optimize-waypoints?key=${API_KEY}`

  const optimizeFor =
    input.optimizationMode === 'SHORTEST' ? 'ShortestRoute' : 'FastestRoute'

  const body = {
    Origin: [input.startLocation.longitude, input.startLocation.latitude],
    OptimizeSequencingFor: optimizeFor,
    TravelMode: 'Car',
    DepartNow: true,
    Waypoints: input.destinations.map((dest) => ({
      Id: dest.destinationId,
      Position: [dest.longitude, dest.latitude],
      ServiceDuration: dest.serviceTimeMinutes * 60, // seconds
    })),
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
      const originalDest = input.destinations.find((d) => d.destinationId === wp.Id)
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

/**
 * Amazon Location Service CalculateRoutes API 호출
 * 최적화된 순서의 좌표를 연결하는 실제 도로 경로를 계산한다.
 */
export async function calculateRoute(
  orderedPositions: [number, number][], // [lon, lat] 순서
): Promise<RouteGeometry> {
  if (orderedPositions.length < 2) {
    throw new Error('CalculateRoutes requires at least 2 positions (origin + destination)')
  }

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
