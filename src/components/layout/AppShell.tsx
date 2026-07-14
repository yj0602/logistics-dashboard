import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { UserRole } from '../../types/auth'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export interface AppShellContext {
  role: UserRole
  refreshKey: number
}

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [role, setRole] = useState<UserRole>(
    location.pathname.startsWith('/employee') ? 'EMPLOYEE' : 'ADMIN',
  )
  const [refreshKey, setRefreshKey] = useState(0)

  const routeRole = location.pathname.startsWith('/employee')
    ? 'EMPLOYEE'
    : location.pathname.startsWith('/admin')
      ? 'ADMIN'
      : null
  const activeRole = routeRole ?? role

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole)

    const path = location.pathname

    // Role-specific dashboard pages: switch to the other role's dashboard
    if (path.startsWith('/admin/dashboard') || path.startsWith('/employee/dashboard')) {
      navigate(nextRole === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard')
    }
    // Shared pages (e.g. /vehicles, /delivery-analysis): stay on the same page
    // The role change via state/context is enough
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="app-shell">
      <Sidebar role={activeRole} />
      <div className="app-main">
        <TopHeader onRoleChange={handleRoleChange} onRefresh={handleRefresh} role={activeRole} />
        <main className="content">
          <Outlet context={{ role: activeRole, refreshKey } satisfies AppShellContext} />
        </main>
      </div>
    </div>
  )
}
