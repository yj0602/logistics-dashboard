import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { EmployeeDashboardPage } from './pages/EmployeeDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { VehicleMonitoringPage } from './pages/VehicleMonitoringPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/vehicles" element={<VehicleMonitoringPage />} />
        <Route
          path="/vehicles/:vehicleId"
          element={<PlaceholderPage title="차량 상세" />}
        />
        <Route
          path="/delivery-analysis"
          element={<PlaceholderPage title="중간 배송 투입 분석" />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}

export default App
