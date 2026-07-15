# 중간 배송 투입 분석 — 데이터 연동 현황

> 작성일: 2026-07-15  
> 대상 페이지: 관리자 중간 배송 분석 / 직원 중간 배송 분석 / 배송 최적 경로

---

## 현재 사용 가능한 API

| API | 엔드포인트 | 용도 |
|-----|-----------|------|
| 허브 목록 | `GET /hubs` | 허브 이름, 좌표 |
| 차량 목록 | `GET /vehicles` | 차량 상태, 현재 위치, 목적지 허브 |
| ETA 예측 | `GET /vehicles/eta` | AI 예측 도착시간, 지연, 신뢰도 |
| 직원 조회 | `GET /employees/{id}` | 직원명, 소속 허브, 배정 차량 |
| 배송지 목록 | `GET /vehicles/{vehicleId}/route-input` | 차량별 배송 목적지 좌표/주소 |
| FM Chat (최적화) | `POST /chat` (with pendingDeliveries) | AI 배송 투입 판단 + 경로 옵션 제안 |
| FM Chat (질문) | `POST /chat` (with message) | 자유 질문 응답, 운영 요약 생성 |
| 경로 최적화 | Amazon Location Service (OptimizeWaypoints + CalculateRoutes) | 배송 순서 최적화 + 도로 경로 |

---

## 관리자 중간 배송 분석 페이지

### 연결 완료 (실시간 데이터)

| 기능 | 데이터 소스 | 설명 |
|------|------------|------|
| 허브별 운영 현황 테이블 | 허브 API + 차량/ETA API | 허브별 막차 ETA, 남은 시간, 도착 예정 차량 수, 투입 판단(위험도) |
| 요약 메트릭 (운영 중 허브, 투입 가능/주의/비추천) | 차량/ETA API | 위험도 기준: 60분+ LOW, 30~59분 MEDIUM, 30분 미만 HIGH |
| AI 운영 요약 | FM Chat API | 허브별 현황 데이터를 FM에 전달 → 관제 요약 자동 생성 |
| 허브 상세 → 직원 목록 | 직원 API (`GET /employees/{id}`) | 허브 클릭 시 해당 허브 소속 직원 실시간 조회 |

### 추정값 (백엔드 추가 필요)

| 항목 | 현재 계산 방식 | 정확한 데이터를 위해 필요한 것 |
|------|--------------|------------------------------|
| 대기 직원 수 | 차량 수 × 추정 비율 | `GET /hubs/{hubId}/employees` (허브별 직원 목록 일괄 조회 API) |
| 예상 처리 건수 | 차량당 30건 추정 | 차량별 route-input을 일괄 조회하거나 허브별 집계 API |
| 직원별 투입 가능 상태 | 기본 "AVAILABLE" 표시 | 직원별 현재 상태를 관리하는 API 또는 AI 분석 |
| 추천 권역 / 예상 복귀 시간 | 미표시 | FM에 직원별 상황을 전달하여 개별 분석 (비용 고려 필요) |

---

## 직원 중간 배송 분석 페이지

### 연결 완료 (실시간 데이터)

| 기능 | 데이터 소스 | 설명 |
|------|------------|------|
| 배정 차량 및 현재 상황 | 차량/ETA API + 허브 API | 막차 ETA, 지연, 신뢰도, 유휴시간 — 모두 실시간 |
| AI 판단 결과 + 추천 옵션 | route-input API + FM Chat API | 실제 배송지를 FM에 전달 → decision/options/summary 자동 생성 |
| 배송지 목록 | route-input API + 거리 계산 | 실제 배송지 좌표에서 허브까지 거리/왕복시간 계산, 투입 가능 여부 표시 |
| AI 질문 (채팅) | FM Chat API | 자유 질문 실시간 응답 |
| 추천 경로 → 최적 경로 조회 | FM 옵션 → Amazon Location Service | FM 옵션 클릭 시 해당 배송지만 필터링하여 경로 최적화 자동 실행 |

### 현재 미사용 (향후 개선)

| 항목 | 이유 | 해결 방법 |
|------|-----|-----------|
| 배송 마감시간 기반 분석 | 현재는 거리 기반 왕복시간만 사용 | FM prompt에 deadline 추가하면 바로 활용 가능 |
| 배송 우선순위 | route-input API에 priority 필드 없음 | API에 priority 필드 추가 시 활용 가능 |

---

## 배송 최적 경로 페이지

### 연결 완료

| 기능 | 데이터 소스 |
|------|------------|
| 배송지 조회 | route-input API |
| 순서 최적화 | Amazon Location Service OptimizeWaypoints |
| 도로 경로 계산 | Amazon Location Service CalculateRoutes |
| FM 추천 필터 | 중간 배송 페이지에서 전달된 delivery IDs로 필터링 |
| 필터 전환 | 페이지 내에서 전체/안전우선/처리량우선/긴급우선 전환 |

---

## FM Chat API 사용 방식

### 엔드포인트
```
POST https://7c9ge0cd58.execute-api.ap-northeast-2.amazonaws.com/prod/chat
```

### 모드 1: 최적화 분석 (직원용)
- **입력**: currentTime, lastVehicleEta, confidence, availableMinutes, hubLocation, pendingDeliveries[{id, address, travelMinutes}]
- **출력**: decision(RECOMMENDED/CAUTION/NOT_RECOMMENDED), options[{name, deliveries, totalDeliveries, estimatedReturnTime, marginMinutes, riskLevel}], summary, warning
- **특징**: deadline 미사용, 거리 기반 왕복 시간 vs 유휴 시간 비교

### 모드 2: 자연어 질문 (관리자 요약 / 직원 질문)
- **입력**: message (자연어 문자열)
- **출력**: 마크다운 형식 응답 텍스트

### 응답 형식
```json
{ "response": "..." }  // 문자열 — 최적화는 JSON in code block, 질문은 마크다운
```

---

## 백엔드 팀에 요청 사항 (우선순위순)

### 1. 허브별 직원 일괄 조회 API (높음)
```
GET /hubs/{hubId}/employees
```
현재는 DRV001~DRV050을 하나씩 호출하여 필터링 중. 일괄 조회 API가 있으면 성능 대폭 개선.

### 2. 허브별 배송 건수 집계 API (중간)
```
GET /hubs/{hubId}/delivery-summary
```
현재는 "차량당 30건"으로 추정. 실제 route-input 데이터 기반 집계가 있으면 정확도 향상.

### 3. 직원 상태 관리 API (낮음 — 향후)
```
GET /employees/{id}/status  →  { availability: "AVAILABLE"|"BUSY"|"OFF_DUTY", ... }
```
현재는 모든 소속 직원을 "투입 가능"으로 표시. 실제 상태 관리가 있으면 정확한 투입 판단 가능.

---

## 요약

| 구분 | 실제 API | FM AI | Mock/추정 |
|------|---------|-------|-----------|
| 차량 위치/상태 | ✅ | - | - |
| ETA 예측 | ✅ | - | - |
| 허브 정보 | ✅ | - | - |
| 직원 정보 | ✅ (개별 조회) | - | - |
| 배송지 목록 | ✅ | - | - |
| 투입 판단/추천 옵션 | - | ✅ | - |
| 운영 요약 | - | ✅ | - |
| 자유 질문 응답 | - | ✅ | - |
| 경로 최적화 | ✅ (Amazon Location) | - | - |
| 대기 직원 수 | - | - | 추정값 |
| 직원별 상태 | - | - | 기본 AVAILABLE |
