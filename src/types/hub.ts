export interface MapPoint {
  lat: number
  lng: number
  x: number
  y: number
}

export interface Hub {
  hubId: string
  name: string
  region: string
  location: MapPoint
}
