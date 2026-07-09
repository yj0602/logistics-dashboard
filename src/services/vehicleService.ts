import { mockEtaPredictions, mockVehicles } from '../mocks/vehicles'
import type { UserRole } from '../types/auth'
import type { VehicleWithEta } from '../types/vehicle'

const EMPLOYEE_HUB_ID = 'HUB-ULSAN'

export async function getVehicles(
  role: UserRole = 'ADMIN',
  employeeHubId = EMPLOYEE_HUB_ID,
): Promise<VehicleWithEta[]> {
  const scopedVehicles =
    role === 'EMPLOYEE'
      ? mockVehicles.filter((vehicle) => vehicle.destinationHubId === employeeHubId)
      : mockVehicles

  return scopedVehicles.map((vehicle) => ({
    ...vehicle,
    eta: mockEtaPredictions.find((eta) => eta.vehicleId === vehicle.vehicleId)!,
  }))
}

export async function getVehicleById(
  vehicleId: string,
): Promise<VehicleWithEta | undefined> {
  const vehicles = await getVehicles('ADMIN')

  return vehicles.find((vehicle) => vehicle.vehicleId === vehicleId)
}
