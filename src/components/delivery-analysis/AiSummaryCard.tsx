import type { AiOperationSummary } from '../../types/deliveryAnalysis'

interface AiSummaryCardProps {
  summary: AiOperationSummary
}

export function AiSummaryCard({ summary }: AiSummaryCardProps) {
  return (
    <section className="card ai-summary-card">
      <div className="card-header">
        <div className="ai-summary-title">
          <span className="ai-icon" aria-hidden="true">✦</span>
          <h2>AI 운영 요약</h2>
          <span className="badge badge-mock">목업 분석 결과</span>
        </div>
        <span className="page-updated">생성 시각: {summary.generatedAt}</span>
      </div>
      <div className="ai-summary-content">
        <p>{summary.content}</p>
      </div>
    </section>
  )
}
