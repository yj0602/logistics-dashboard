import { useState } from 'react'
import type { AiQaPair } from '../../types/deliveryAnalysis'

interface AiQuestionPanelProps {
  qaList: AiQaPair[]
  defaultAnswer: string
}

interface ChatMessage {
  role: 'user' | 'ai'
  content: string
}

export function AiQuestionPanel({ qaList, defaultAnswer }: AiQuestionPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const handleQuestion = (question: string) => {
    const qaPair = qaList.find((qa) => qa.question === question)
    const answer = qaPair?.answer ?? defaultAnswer

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: answer },
    ])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const question = input.trim()
    setInput('')

    const qaPair = qaList.find((qa) => qa.question === question)
    const answer = qaPair?.answer ?? defaultAnswer

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'ai', content: answer },
    ])
  }

  return (
    <section className="card ai-question-card">
      <div className="card-header">
        <div className="ai-summary-title">
          <span className="ai-icon" aria-hidden="true">✦</span>
          <h2>AI 질문</h2>
          <span className="badge badge-mock">목업</span>
        </div>
      </div>

      <div className="ai-question-suggestions">
        {qaList.map((qa, idx) => (
          <button
            key={idx}
            className="btn btn-sm ai-suggestion-btn"
            onClick={() => handleQuestion(qa.question)}
          >
            {qa.question}
          </button>
        ))}
      </div>

      {messages.length > 0 && (
        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-chat-message ai-chat-${msg.role}`}>
              <span className="ai-chat-role">{msg.role === 'user' ? '질문' : 'AI'}</span>
              <p>{msg.content}</p>
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
          aria-label="AI 질문 입력"
        />
        <button type="submit" className="btn btn-primary btn-sm">
          전송
        </button>
      </form>
    </section>
  )
}
