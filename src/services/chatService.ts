/**
 * FM Chat API 서비스
 *
 * 두 가지 모드를 지원한다:
 * 1. 최적화 모드: pendingDeliveries 정보를 전달하면 경로 최적화 분석 결과를 반환
 * 2. 챗봇 모드: message를 전달하면 자유 질의응답 결과를 반환
 *
 * 실제 API 응답 형식: { response: "..." }
 * - 최적화 모드: response에 마크다운 코드블록으로 감싼 JSON 문자열
 * - 챗봇 모드: response에 마크다운 텍스트
 *
 * VITE_CHAT_API_URL 환경 변수를 base URL로 사용한다.
 */

import { apiPost } from './apiClient'
import type {
  ChatMessageRequest,
  ChatMessageResponse,
  ChatOptimizationRequest,
  ChatOptimizationResponse,
  ChatRawResponse,
  ChatRequest,
} from '../types/chat'

function getChatBaseUrl(): string {
  const url = import.meta.env.VITE_CHAT_API_URL
  if (!url) {
    throw new Error('VITE_CHAT_API_URL 환경 변수가 설정되지 않았습니다.')
  }
  return url.replace(/\/+$/, '')
}

/**
 * 마크다운 코드블록에서 JSON 문자열을 추출한다.
 * ```json ... ``` 또는 ``` ... ``` 형태를 처리.
 * 코드블록이 없으면 원본 문자열을 그대로 반환한다.
 */
function extractJsonFromMarkdown(raw: string): string {
  // ```json ... ``` 또는 ``` ... ``` 패턴 매칭
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  // 코드블록이 없으면 원본 그대로 사용
  return raw.trim()
}

/**
 * 최적화 모드 — 배송 가능 여부 및 경로 제안을 FM에 요청
 */
export async function requestOptimization(
  payload: ChatOptimizationRequest,
  options?: { signal?: AbortSignal },
): Promise<ChatOptimizationResponse> {
  const rawResponse = await apiPost<ChatRawResponse, ChatRequest>(
    '/chat',
    payload,
    { fullUrl: getChatBaseUrl(), signal: options?.signal },
  )

  const jsonStr = extractJsonFromMarkdown(rawResponse.response)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('FM 최적화 응답을 파싱할 수 없습니다.')
  }

  // 응답 구조 검증
  const result = parsed as ChatOptimizationResponse
  if (!result.decision || !Array.isArray(result.options)) {
    throw new Error('FM 최적화 응답 구조가 올바르지 않습니다.')
  }

  return result
}

/**
 * 챗봇 모드 — 자유 질문에 대한 FM 응답을 요청
 */
export async function sendChatMessage(
  message: string,
  options?: { signal?: AbortSignal },
): Promise<ChatMessageResponse> {
  const payload: ChatMessageRequest = { message }

  const rawResponse = await apiPost<ChatRawResponse, ChatRequest>(
    '/chat',
    payload,
    { fullUrl: getChatBaseUrl(), signal: options?.signal },
  )

  return { answer: rawResponse.response }
}
