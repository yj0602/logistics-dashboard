import { useEffect, useState } from 'react'
import type { UserRole } from '../../types/auth'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

interface TopHeaderProps {
  role: UserRole
  onRoleChange?: (role: UserRole) => void
  onRefresh: () => void
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function TopHeader({ role, onRefresh }: TopHeaderProps) {
  const { user } = useAuth()
  const isAdmin = role === 'ADMIN'
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatTime(new Date()))
    }, 1_000)

    return () => clearInterval(timer)
  }, [])

  // 사용자 표시 정보
  const displayName = user?.name ?? (isAdmin ? '관리자' : '직원')
  const displayRole = user
    ? (user.role === 'ADMIN' ? '관리자' : '배송기사')
    : (isAdmin ? '관리자' : '직원')
  const avatarText = user
    ? user.name.slice(0, 2)
    : (isAdmin ? 'AD' : 'EM')
  const hubInfo = user?.hubId ? ` (${user.hubId})` : ''

  return (
    <header className="top-header">
      <div className="role-indicator" aria-label="현재 모드">
        <span className={`role-indicator-item ${isAdmin ? 'is-active' : ''}`}>
          관리자
        </span>
        <span className={`role-indicator-item ${!isAdmin ? 'is-active' : ''}`}>
          직원
        </span>
      </div>
      <time className="header-time">{currentTime}</time>
      {/* <div className="notification">
        알림
        <span>3</span>
      </div> */}
      <div className="user-profile">
        <span className="avatar">{avatarText}</span>
        <div>
          <strong>{displayName}{hubInfo}</strong>
          <small>{displayRole}</small>
        </div>
      </div>
      <Button className="header-action" onClick={onRefresh}>새로고침</Button>
    </header>
  )
}
