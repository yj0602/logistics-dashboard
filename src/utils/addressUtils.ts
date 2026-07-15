/**
 * 한글 주소를 동/읍/면 단위까지 잘라서 반환한다.
 *
 * 예시:
 *   "서울특별시 강남구 역삼동 123-45" → "서울특별시 강남구 역삼동"
 *   "경기도 성남시 분당구 정자동 45-12" → "경기도 성남시 분당구 정자동"
 *   "부산광역시 해운대구 우동 100" → "부산광역시 해운대구 우동"
 *   "경기도 양평군 양평읍 12-3" → "경기도 양평군 양평읍"
 *
 * 동/읍/면을 찾지 못하면 구/군/시 단위까지 잘라본다.
 * 그마저도 찾지 못하면 원본 주소를 그대로 반환한다.
 */
export function truncateAddressToDistrict(address: string | undefined | null): string {
  if (!address) return ''

  const parts = address.split(/\s+/)

  // 동/읍/면으로 끝나는 토큰까지 포함하여 잘라낸다.
  let cutIndex = -1

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].endsWith('동') || parts[i].endsWith('읍') || parts[i].endsWith('면')) {
      cutIndex = i
      break
    }
  }

  if (cutIndex !== -1) {
    return parts.slice(0, cutIndex + 1).join(' ')
  }

  // 동/읍/면을 찾지 못한 경우, 구/군 단위까지 잘라본다
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].endsWith('구') || parts[i].endsWith('군')) {
      cutIndex = i
      break
    }
  }

  if (cutIndex === -1) {
    // 구/군도 없으면 시 단위까지
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].endsWith('시')) {
        cutIndex = i
        break
      }
    }
  }

  if (cutIndex === -1) {
    return address
  }

  return parts.slice(0, cutIndex + 1).join(' ')
}
