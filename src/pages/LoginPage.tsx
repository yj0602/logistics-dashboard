import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="brand-mark">LC</span>
        <h1>물류 관제 시스템</h1>
        <p>AI 기반 ETA와 차량 위치를 한 화면에서 확인하는 운영 대시보드입니다.</p>
      </section>
      <section className="login-panel">
        <h2>로그인</h2>
        <label>
          이메일 또는 아이디
          <input placeholder="admin" type="text" />
        </label>
        <label>
          비밀번호
          <input placeholder="password" type="password" />
        </label>
        <Link to="/admin/dashboard">
          <Button variant="primary">관리자 모드로 진입</Button>
        </Link>
      </section>
    </main>
  )
}
