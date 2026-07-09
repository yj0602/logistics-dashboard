import { mockHubs } from '../mocks/hubs'
import type { Hub } from '../types/hub'

export async function getHubs(): Promise<Hub[]> {
  return mockHubs
}
