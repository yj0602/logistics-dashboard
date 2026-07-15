import { useCallback, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import type { AiQaPair } from '../../types/deliveryAnalysis'
import { sendChatMessage } from '../../services/chatService'

interface AiQuestionPanelProps {
  qaList: AiQaPair[]
  defaultAnswer: string
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
  isLoading?: boolean
  isError?: boolean
}

export function AiQuestionPanel({ qaList, defaultAnswer }: AiQuestionPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const askFm = useCallback(async (question: string) => {
    // 사용자 메시지 추가 + 로딩 표시
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: '답변을 생성하고 있습니다...', isLoading: true },
    ])
    setIsSending(true)

    // 이전 요청 취소
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await sendChatMessage(question, { signal: controller.signal })

      // 로딩 메시지를 실제 응답으로 교체
      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        updated[lastIdx] = { role: 'ai', content: response.answer }
        return updated
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 사용자가 새 질문을 보낸 경우 — 로딩 메시지 제거
        setMessages((prev) => prev.filter((m) => !m.isLoading))
        return
      }

      // 에러 시 로컬 fallback (qaList 매칭 또는 defaultAnswer)
      const qaPair = qaList.find((qa) => qa.question === question)
      const fallback = qaPair?.answer ?? defaultAnswer

      setMessages((prev) => {
        const updated = [...prev]
        const lastIdx = updated.length - 1
        updated[lastIdx] = {
          role: 'ai',
          content: fallback,
          isError: true,
        }
        return updated
      })
    } finally {
      setIsSending(false)
    }
  }, [qaList, defaultAnswer])

  const handleQuestion = (question: string) => {
    void askFm(question)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const question = input.trim()
    setInput('')
    void askFm(question)
  }

  return (
    <section className="card ai-question-card">
      <div className="card-header">
        <div className="ai-summary-title">
          <span className="ai-icon" aria-hidden="true">✦</span>
          <h2>AI 질문</h2>
        </div>
      </div>

      <div className="ai-question-suggestions">
        {qaList.map((qa, idx) => (
          <button
            key={idx}
            className="btn btn-sm ai-suggestion-btn"
            onClick={() => handleQuestion(qa.question)}
            disabled={isSending}
          >
            {qa.question}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`ai-chat-message ai-chat-${msg.role}${msg.isLoading ? ' ai-chat-loading' : ''}${msg.isError ? ' ai-chat-error' : ''}`}
            >
              <span className="ai-chat-role">{msg.role === 'user' ? '질문' : 'AI'}</span>
              {msg.role === 'ai' && !msg.isLoading ? (
                <div className="ai-chat-markdown">
                  <Markdown>{msg.content}</Markdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
              {msg.isError && (
                <span className="ai-chat-fallback-note">(API 연결 실패 — 로컬 응답)</span>
              )}
            </div>
          ))}
        </div>
      )}

      <form className="ai-chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="질문을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          aria-label="AI 질문 입력"
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={isSending}>
          {isSending ? '전송 중...' : '전송'}
        </button>
      </form>
    </section>
  )
}
