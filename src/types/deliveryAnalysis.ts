// ===== Shared Types =====

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export type DeliveryDecision = 'RECOMMENDED' | 'CAUTION' | 'NOT_RECOMMENDED'

export type EmployeeAvailability = 'AVAILABLE' | 'CAUTION' | 'UNAVAILABLE'

export type DestinationStatus = 'URGENT' | 'NORMAL' | 'COMPLETED'

// ===== Admin Types =====

export interface AdminAnalysisSummary {
  waitingEmployees: number
  availableEmployees: number
  cautionEmployees: number
  unavailableEmployees: number
  expectedDeliveries: number
  averageIdleMinutes: number
}

export interface HubOperationRow {
  hubId: string
  hubName: string
  lastVehicleEta: string
  remainingMinutes: number
  waitingEmployees: number
  availableEmployees: number
  expectedDeliveries: number
  averageBufferMinutes: number
  riskLevel: RiskLevel
}

export interface HubEmployee {
  employeeId: string
  employeeName: string
  status: EmployeeAvailability
  recommendedArea: string
  estimatedReturnTime: string
  bufferMinutes: number
}

export interface HubDetail {
  hubId: string
  hubName: string
  lastVehicleEta: string
  waitingEmployees: number
  employees: HubEmployee[]
  expectedDeliveries: number
  riskFactors: string[]
}

export interface AiOperationSummary {
  content: string
  generatedAt: string
}

export interface AdminAnalysisData {
  summary: AdminAnalysisSummary
  aiSummary: AiOperationSummary
  hubs: HubOperationRow[]
  hubDetails: Record<string, HubDetail>
  updatedAt: string
}

// ===== Employee Types =====

export interface EmployeeSituation {
  employeeId: string
  employeeName: string
  hubId: string
  hubName: string
  assignedVehicleId: string
  vehicleStatus: 'ARRIVED' | 'IN_TRANSIT' | 'DELAYED'
  estimatedArrivalTime: string
  delayMinutes: number
  confidence: number
  predictionUpdatedAt: string
  availableIdleMinutes: number
}

export interface AiDecisionResult {
  decision: DeliveryDecision
  title: string
  summary: string
  recommendedOptionId: string
  estimatedReturnTime: string
  lastVehicleEta: string
  bufferMinutes: number
  riskLevel: RiskLevel
  warning: string
}

export interface DeliveryOption {
  optionId: string
  title: string
  description: string
  destinationCount: number
  totalDistanceKm: number
  travelMinutes: number
  serviceMinutes: number
  totalDurationMinutes: number
  estimatedReturnTime: string
  bufferMinutes: number
  riskLevel: RiskLevel
  recommended: boolean
}

export interface Destination {
  destinationId: string
  sequence: number
  name: string
  address: string
  distanceFromHubKm: number
  travelMinutes: number
  serviceMinutes: number
  deadline: string
  priority: number
  status: DestinationStatus
}

export type DestinationSortKey =
  | 'ai-recommended'
  | 'round-trip'
  | 'distance'
  | 'deadline'
  | 'priority'

export interface AiQaPair {
  question: string
  answer: string
}

export interface EmployeeAnalysisData {
  situation: EmployeeSituation
  decision: AiDecisionResult
  options: DeliveryOption[]
  destinations: Record<string, Destination[]>
  aiQa: AiQaPair[]
  defaultAnswer: string
  updatedAt: string
}
