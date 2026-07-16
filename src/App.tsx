import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppShell } from './components/layout/AppShell'
import { AuthGuard } from './components/layout/AuthGuard'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { DeliveryAnalysisPage } from './pages/DeliveryAnalysisPage'
import { EmployeeDashboardPage } from './pages/EmployeeDashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RouteOptimizationTestPage } from './pages/RouteOptimizationTestPage'
import { VehicleMonitoringPage } from './pages/VehicleMonitoringPage'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route index element={<RootRedirect />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
            <Route path="/vehicles" element={<VehicleMonitoringPage />} />
            <Route
              path="/vehicles/:vehicleId"
              element={<PlaceholderPage title="차량 상세" />}
            />
            <Route
              path="/delivery-analysis"
              element={<DeliveryAnalysisPage />}
            />
            <Route
              path="/route-optimization"
              element={<RouteOptimizationTestPage />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

/** 루트 경로 접근 시 role에 맞는 대시보드로 리다이렉트 */
function RootRedirect() {
  const { user } = useAuth()
  if (user?.role === 'EMPLOYEE') {
    return <Navigate to="/employee/dashboard" replace />
  }
  return <Navigate to="/admin/dashboard" replace />
}

export default App
