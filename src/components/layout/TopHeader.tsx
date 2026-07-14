import { useEffect, useState } from 'react'
import type { UserRole } from '../../types/auth'
import { Button } from '../ui/Button'

interface TopHeaderProps {
  role: UserRole
  onRoleChange: (role: UserRole) => void
  onRefresh: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function TopHeader({ role, onRoleChange, onRefresh }: TopHeaderProps) {
  const isAdmin = role === 'ADMIN'
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()))
    }, 1_000) // 매초 갱신

    return () => clearInterval(timer)
  }, [])

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
      <time className="header-time">{currentTime}</time>
      <div className="notification">
        알림
        <span>3</span>
      </div>
      <div className="user-profile">
        <span className="avatar">{isAdmin ? 'AD' : 'KIM'}</span>
        <div>
          <strong>{isAdmin ? 'admin' : 'HUB074'}</strong>
          <small>{isAdmin ? '관리자' : '양산 Hub 직원'}</small>
        </div>
      </div>
      <Button className="header-action" onClick={onRefresh}>새로고침</Button>
    </header>
  )
}
