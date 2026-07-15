import { useOutletContext } from 'react-router-dom'
import type { AppShellContext } from '../components/layout/AppShell'
import { AdminDeliveryAnalysis } from '../components/delivery-analysis/AdminDeliveryAnalysis'
import { EmployeeDeliveryAnalysis } from '../components/delivery-analysis/EmployeeDeliveryAnalysis'

export function DeliveryAnalysisPage() {
  const { role, refreshKey } = useOutletContext<AppShellContext>()

  if (role === 'EMPLOYEE') {
    return <EmployeeDeliveryAnalysis refreshKey={refreshKey} />
  }

  return <AdminDeliveryAnalysis refreshKey={refreshKey} />
}
