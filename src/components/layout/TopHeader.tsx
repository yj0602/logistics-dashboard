import type { UserRole } from '../../types/auth'
import { Button } from '../ui/Button'

interface TopHeaderProps {
  role: UserRole
  onRoleChange: (role: UserRole) => void
}

export function TopHeader({ role, onRoleChange }: TopHeaderProps) {
  const isAdmin = role === 'ADMIN'

  return (
    <header className="top-header">
      <div className="role-switch" aria-label="현재 역할">
        <button
          className={`role-switch-item ${isAdmin ? 'is-active' : ''}`}
          onClick={() => onRoleChange('ADMIN')}
          type="button"
        >
          관리자
        </button>
        <button
          className={`role-switch-item ${!isAdmin ? 'is-active' : ''}`}
          onClick={() => onRoleChange('EMPLOYEE')}
          type="button"
        >
          직원
        </button>
      </div>
      <time className="header-time">05:30</time>
      <div className="notification">
        알림
        <span>3</span>
      </div>
      <div className="user-profile">
        <span className="avatar">{isAdmin ? 'AD' : 'UL'}</span>
        <div>
          <strong>{isAdmin ? 'admin' : 'ulsan_hub01'}</strong>
          <small>{isAdmin ? '관리자' : '울산 Hub 직원'}</small>
        </div>
      </div>
      <Button className="header-action">새로고침</Button>
    </header>
  )
}
