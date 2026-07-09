import maplibregl from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'

export interface UseMapLibreOptions {
  /** Center coordinates [longitude, latitude] */
  center?: [number, number]
  /** Initial zoom level */
  zoom?: number
  /** Min zoom level */
  minZoom?: number
  /** Max zoom level */
  maxZoom?: number
  /** Whether to show NavigationControl */
  navigationControl?: boolean
  /** Whether user interaction is enabled */
  interactive?: boolean
}

export interface UseMapLibreReturn {
  mapRef: React.RefObject<HTMLDivElement | null>
  map: maplibregl.Map | null
  isLoaded: boolean
  error: string | null
}

const DEFAULT_CENTER: [number, number] = [127.5, 36.5]
const DEFAULT_ZOOM = 7

function getMapStyleUrl(): { url: string; error: string | null } {
  const region = import.meta.env.VITE_AWS_REGION
  const apiKey = import.meta.env.VITE_AMAZON_LOCATION_API_KEY

  if (!region) {
    return { url: '', error: 'VITE_AWS_REGION 환경변수가 설정되지 않았습니다.' }
  }

  if (!apiKey) {
    return { url: '', error: 'VITE_AMAZON_LOCATION_API_KEY 환경변수가 설정되지 않았습니다.' }
  }

  const url = `https://maps.geo.${region}.amazonaws.com/v2/styles/Standard/descriptor?key=${apiKey}`
  return { url, error: null }
}

export function useMapLibre(options: UseMapLibreOptions = {}): UseMapLibreReturn {
  const {
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    minZoom,
    maxZoom,
    navigationControl = false,
    interactive = true,
  } = options

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<maplibregl.Map | null>(null)
  const [styleConfig] = useState(getMapStyleUrl)
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(() => styleConfig.error)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstanceRef.current) return

    const { url, error: configError } = styleConfig

    if (configError) {
      console.error(`[Amazon Location] ${configError}`)
      return
    }

    let cancelled = false

    try {
      const mapInstance = new maplibregl.Map({
        container: mapRef.current,
        style: url,
        center,
        zoom,
        minZoom,
        maxZoom,
        interactive,
        attributionControl: false,
      })

      mapInstanceRef.current = mapInstance

      if (navigationControl) {
        mapInstance.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          'top-right',
        )
      }

      mapInstance.on('load', () => {
        if (!cancelled) {
          setIsLoaded(true)
          setMap(mapInstance)
        }
      })

      mapInstance.on('error', (event) => {
        const message = event.error?.message ?? '지도 로드에 실패했습니다.'
        console.error('[Amazon Location] Map error:', message)
        if (!cancelled) {
          setError(message)
        }
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : '지도 초기화에 실패했습니다.'
      console.error('[Amazon Location] Init error:', message)
      window.setTimeout(() => {
        if (!cancelled) {
          setError(message)
        }
      }, 0)
    }

    return () => {
      cancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        setMap(null)
        setIsLoaded(false)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { mapRef, map, isLoaded, error }
}
