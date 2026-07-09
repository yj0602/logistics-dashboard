import type maplibregl from 'maplibre-gl'
import { type ReactNode, useEffect, useRef } from 'react'
import { useMapLibre } from '../../hooks/useMapLibre'
import type { UseMapLibreOptions } from '../../hooks/useMapLibre'

export interface AmazonMapProps extends UseMapLibreOptions {
  /** CSS class for the map container */
  className?: string
  /** Callback when map is loaded and ready */
  onMapReady?: (map: maplibregl.Map) => void
  /** Optional overlay content rendered on top of the map */
  children?: ReactNode
}

export function AmazonMap({
  className = '',
  onMapReady,
  children,
  ...mapOptions
}: AmazonMapProps) {
  const { mapRef, map, isLoaded, error } = useMapLibre(mapOptions)
  const onMapReadyCalledRef = useRef(false)

  useEffect(() => {
    if (map && isLoaded && onMapReady && !onMapReadyCalledRef.current) {
      onMapReadyCalledRef.current = true
      onMapReady(map)
    }
  }, [map, isLoaded, onMapReady])

  if (error) {
    return (
      <div className={`amazon-map-container ${className}`}>
        <div className="amazon-map-error">
          <span className="amazon-map-error-icon">⚠</span>
          <p>지도를 불러올 수 없습니다.</p>
          <small>{error}</small>
        </div>
      </div>
    )
  }

  return (
    <div className={`amazon-map-container ${className}`}>
      <div className="amazon-map" ref={mapRef} />
      {isLoaded && children && (
        <div className="amazon-map-overlay">{children}</div>
      )}
    </div>
  )
}
