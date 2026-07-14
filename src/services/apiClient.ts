/**
 * 공통 API 클라이언트
 *
 * 모든 서비스에서 공유하는 base URL 및 fetch 헬퍼.
 * VITE_API_BASE_URL 환경 변수를 사용한다.
 */

function getBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL 환경 변수가 설정되지 않았습니다.')
  }
  // 끝 슬래시 제거
  return baseUrl.replace(/\/+$/, '')
}

export interface ApiRequestOptions {
  signal?: AbortSignal
}

/**
 * GET 요청을 수행하고 JSON 응답을 반환한다.
 * HTTP 오류 및 네트워크 오류를 한글 메시지로 변환.
 */
export async function apiGet<T>(
  path: string,
  options?: ApiRequestOptions,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: options?.signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    console.error('[API] 네트워크 오류:', err)
    throw new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.', { cause: err })
  }

  if (!response.ok) {
    const status = response.status
    if (status === 404) {
      throw new Error(`요청한 리소스를 찾을 수 없습니다. (HTTP 404)`)
    }
    console.error('[API] HTTP 오류:', status, url)
    throw new Error(`API 요청에 실패했습니다. (HTTP ${status})`)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('API 응답을 파싱할 수 없습니다.')
  }

  return data as T
}
