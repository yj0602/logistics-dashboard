import { NavLink } from 'react-router-dom'
import type { UserRole } from '../../types/auth'

export function Sidebar({ role }: { role: UserRole }) {
  const dashboardPath =
    role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard'
  const navItems = [
    { label: '대시보드', path: dashboardPath },
    { label: '실시간 지도', path: '/vehicles' },
    { label: '중간 배송', path: '/delivery-analysis' },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">LC</span>
        <span>물류 관제 시스템</span>
      </div>
      <nav className="sidebar-nav" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <NavLink
            key={`${item.label}-${item.path}`}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'is-active' : ''}`
            }
            to={item.path}
          >
            <span className="nav-dot" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <NavLink className="sidebar-logout" to="/login">
        로그아웃
      </NavLink>
    </aside>
  )
}
