import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { sendChatMessage } from '../../services/chatService'
import type { HubOperationRow } from '../../types/deliveryAnalysis'

interface AiSummaryCardProps {
  hubs: HubOperationRow[]
}

/**
 * 허브 운영 현황을 요약하여 FM Chat에 전달할 메시지를 구성한다.
 */
function buildSummaryPrompt(hubs: HubOperationRow[]): string {
  if (hubs.length === 0) return '현재 운영 중인 허브가 없습니다. 상황을 요약해주세요.'

  const hubSummaries = hubs.map((h) =>
    `${h.hubName}: 막차 ETA ${h.lastVehicleEta}, 막차까지 남은시간 ${h.remainingMinutes}분, 운행중 간선차량 ${h.waitingEmployees}대, 도착완료 ${h.availableEmployees}대, 투입판단 ${h.riskLevel === 'LOW' ? '투입가능' : h.riskLevel === 'MEDIUM' ? '주의' : '비추천'}`,
  ).join('\n')

  return `물류 관제 관리자입니다. 아래 허브별 간선차량 운영 현황을 보고 중간 배송 투입 관점에서 핵심 요약을 3~4줄로 간결하게 해주세요. 막차 도착까지 여유시간이 충분한 허브에서는 대기 직원이 중간 배송에 투입될 수 있습니다. 어떤 허브가 여유가 있고, 어떤 허브가 주의가 필요한지 알려주세요.\n\n${hubSummaries}`
}

export function AiSummaryCard({ hubs }: AiSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const [generatedAt, setGeneratedAt] = useState<string>('-')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (hubs.length === 0) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let cancelled = false

    const fetchSummary = async () => {
      setIsLoading(true)
      setError(false)

      try {
        const prompt = buildSummaryPrompt(hubs)
        const response = await sendChatMessage(prompt, { signal: controller.signal })
        if (!cancelled) {
          setSummary(response.answer)
          setGeneratedAt(new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }))
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!cancelled) {
          setError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void fetchSummary()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [hubs])

  return (
    <section className="card ai-summary-card">
      <div className="card-header">
        <div className="ai-summary-title">
          <span className="ai-icon" aria-hidden="true">✦</span>
          <h2>AI 운영 요약</h2>
          {isLoading && <span className="badge badge-info">생성 중...</span>}
          {!isLoading && summary && <span className="badge badge-info">실시간 AI</span>}
        </div>
        {!isLoading && summary && (
          <span className="page-updated">생성 시각: {generatedAt}</span>
        )}
      </div>
      <div className="ai-summary-content">
        {isLoading && <p className="text-secondary">AI가 운영 현황을 분석하고 있습니다...</p>}
        {error && <p className="text-secondary">AI 요약 생성에 실패했습니다. 허브별 현황 테이블을 직접 확인해주세요.</p>}
        {!isLoading && !error && summary && (
          <div className="ai-chat-markdown">
            <Markdown>{summary}</Markdown>
          </div>
        )}
        {!isLoading && !error && !summary && hubs.length === 0 && (
          <p className="text-secondary">운영 중인 허브가 없어 AI 요약을 생성할 수 없습니다.</p>
        )}
      </div>
    </section>
  )
}
