import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function LoginPage() {
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
        <label>
          이메일 또는 아이디
          <input placeholder="이메일 또는 아이디를 입력하세요" type="text" />
        </label>
        <label>
          비밀번호
          <input placeholder="비밀번호를 입력하세요" type="password" />
        </label>
        <Link to="/admin/dashboard">
          <Button variant="primary">관리자 모드로 진입</Button>
        </Link>
        <Link to="/employee/dashboard">
          <Button>직원 모드로 진입</Button>
        </Link>
      </section>
    </main>
  )
}
