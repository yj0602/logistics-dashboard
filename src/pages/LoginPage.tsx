import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { getEmployee } from '../services/employeeService'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [employeeId, setEmployeeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    const id = employeeId.trim()
    if (!id) {
      setError('직원 ID를 입력해 주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const user = await getEmployee(id)
      login(user)

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true })
      } else {
        navigate('/employee/dashboard', { replace: true })
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '로그인에 실패했습니다.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="brand-mark">LC</span>
        <h1>물류 관제 시스템</h1>
        <p>AI 기반 실시간 도착 예측</p>
        <ul className="login-features">
          <li>
            <strong>실시간 관제</strong>
            <span>차량 위치, 상태, 도착 예상 시간을 실시간으로 확인합니다.</span>
          </li>
          <li>
            <strong>지능형 알림</strong>
            <span>지연, 도착 임박 등 주요 상황을 즉시 안내합니다.</span>
          </li>
          <li>
            <strong>효율적 의사결정</strong>
            <span>데이터 기반 분석으로 인력 및 배송 자원을 효율적으로 운영합니다.</span>
          </li>
        </ul>
      </section>
      <section className="login-panel">
        <h2>로그인</h2>
        <form onSubmit={handleLogin}>
          <label>
            직원 ID
            <input
              placeholder="예: ADM001 또는 DRV001"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </label>
          <p className="login-hint">
            관리자: ADM + 번호 | 배송기사: DRV + 번호
          </p>
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}
          <Button variant="primary" disabled={isLoading}>
            {isLoading ? '확인 중...' : '로그인'}
          </Button>
        </form>
      </section>
    </main>
  )
}
