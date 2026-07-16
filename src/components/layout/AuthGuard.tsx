import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * 인증 가드: 로그인하지 않은 사용자를 /login으로 리다이렉트한다.
 * 로그인 후 원래 접근하려던 경로로 돌아갈 수 있도록 location state에 from을 저장한다.
 */
export function AuthGuard() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <Outlet />
}
