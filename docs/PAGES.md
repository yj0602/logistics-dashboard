# Page Definitions

## 1. 문서 목적

이 문서는 프론트엔드의 페이지 목록, 라우팅 경로, 접근 가능한 사용자 역할과 각 페이지의 주요 책임을 정의한다.

상세 화면 구성과 UI 동작은 `FRONTEND_SPEC.md`를 따른다.

API 요청 및 응답 구조는 `API_CONTRACT.md`를 따른다.

---

# 2. Route Overview

| Page        | Route                  | Access          |
| ----------- | ---------------------- | --------------- |
| 로그인         | `/login`               | Public          |
| 관리자 대시보드    | `/admin/dashboard`     | ADMIN           |
| 현장 직원 대시보드  | `/employee/dashboard`  | EMPLOYEE        |
| 차량 관제       | `/vehicles`            | ADMIN, EMPLOYEE |
| 차량 상세       | `/vehicles/:vehicleId` | ADMIN, EMPLOYEE |
| 중간 배송 투입 분석 | `/delivery-analysis`   | ADMIN, EMPLOYEE |

---

# 3. 공통 라우팅 규칙

## 3.1 로그인 전 접근

로그인하지 않은 사용자는 `/login`만 접근할 수 있다.

인증이 필요한 페이지에 접근하면 로그인 화면으로 이동한다.

---

## 3.2 로그인 후 기본 이동

사용자 역할에 따라 로그인 후 기본 이동 경로를 다르게 한다.

### ADMIN

```text
/admin/dashboard
```

### EMPLOYEE

```text
/employee/dashboard
```

---

## 3.3 역할별 접근 제한

### ADMIN

접근 가능한 페이지:

* `/admin/dashboard`
* `/vehicles`
* `/vehicles/:vehicleId`
* `/delivery-analysis`

### EMPLOYEE

접근 가능한 페이지:

* `/employee/dashboard`
* `/vehicles`
* `/vehicles/:vehicleId`
* `/delivery-analysis`

EMPLOYEE는 `/admin/dashboard`에 접근할 수 없다.

---

## 3.4 존재하지 않는 경로

정의되지 않은 경로에 접근하면 적절한 기본 화면으로 이동한다.

로그인 상태에 따라 다음 경로를 사용할 수 있다.

* 비로그인 사용자: `/login`
* ADMIN: `/admin/dashboard`
* EMPLOYEE: `/employee/dashboard`

---

# 4. 로그인

## Route

```text
/login
```

## Access

```text
Public
```

## Purpose

사용자가 시스템에 진입하고 사용할 역할을 결정한다.

---

## Main Responsibilities

* 아이디 또는 이메일 입력
* 비밀번호 입력
* 로그인 실행
* 로그인 유지 선택
* 로그인 실패 오류 표시

---

## Prototype Behavior

현재 발표용 구현에서는 실제 인증 대신 Mock Login을 사용할 수 있다.

사용자는 다음 역할 중 하나로 시스템에 진입할 수 있다.

* ADMIN
* EMPLOYEE

역할에 따라 로그인 후 이동하는 대시보드가 달라진다.

---

# 5. 관리자 대시보드

## Route

```text
/admin/dashboard
```

## Access

```text
ADMIN
```

## Purpose

관리자가 전체 물류 운영 상황을 한눈에 확인한다.

---

## Main Questions

* 현재 전체 차량 운영에 문제가 있는가?
* 어떤 차량이 지연되고 있는가?
* 어느 Hub에 문제가 있는가?
* 마지막 차량은 언제 도착하는가?
* 대기 인력을 다른 배송 업무에 투입할 수 있는가?

---

## Main Sections

* 전체 차량 수
* 도착 차량 수
* 운행 중 차량 수
* 지연 차량 수
* 막차 ETA
* 지연 차량 목록
* Hub별 운영 현황
* 중간 배송 투입 가능 현황

---

## Main Navigation

이 페이지에서 다음 화면으로 이동할 수 있다.

* 차량 관제
* 특정 차량 상세
* 중간 배송 투입 분석

---

# 6. 현장 직원 대시보드

## Route

```text
/employee/dashboard
```

## Access

```text
EMPLOYEE
```

## Purpose

현장 직원이 자신의 Hub와 관련된 차량 도착 상황 및 현재 업무 가능 여부를 확인한다.

---

## Main Questions

* 내 Hub로 오는 차량은 몇 대인가?
* 어떤 차량이 지연되고 있는가?
* 막차는 언제 도착하는가?
* 현재 얼마나 기다려야 하는가?
* 중간 배송 업무를 수행할 수 있는가?

---

## Main Sections

* 소속 Hub 정보
* 도착 완료 차량 수
* 남은 차량 수
* 지연 차량 수
* 막차 ETA
* 남은 대기 시간
* 중간 배송 투입 가능 여부

---

## Data Scope

현장 직원에게는 다음 정보만 표시한다.

* 자신의 소속 Hub
* 자신의 Hub로 오는 차량
* 해당 차량의 위치 및 ETA
* 자신의 중간 배송 투입 분석 결과

다른 Hub의 상세 운영 정보는 표시하지 않는다.

---

## Main Navigation

이 페이지에서 다음 화면으로 이동할 수 있다.

* 차량 관제
* 특정 차량 상세
* 중간 배송 투입 분석

---

# 7. 차량 관제

## Route

```text
/vehicles
```

## Access

```text
ADMIN
EMPLOYEE
```

## Purpose

차량의 현재 위치와 운행 상태를 지도와 목록으로 확인한다.

---

## ADMIN Scope

관리자는 다음 정보를 조회한다.

* 전체 Hub
* 전체 차량
* 전체 차량의 현재 위치
* 전체 차량의 상태
* 차량별 ETA

---

## EMPLOYEE Scope

현장 직원은 다음 정보를 조회한다.

* 자신의 소속 Hub
* 자신의 Hub로 오는 차량
* 해당 차량의 현재 위치
* 해당 차량의 상태
* 해당 차량의 ETA

---

## Main Sections

* 차량 위치 지도
* Hub 위치
* 차량 현재 위치
* 차량 이동 경로
* 차량 목록
* 상태 필터
* 선택 차량 정보

---

## Main Interactions

* 차량 목록에서 차량 선택
* 지도에서 차량 선택
* 선택된 차량 강조
* 차량 상태별 필터링
* 특정 차량 상세 페이지로 이동

---

## Navigation Target

차량 선택 후 다음 경로로 이동할 수 있다.

```text
/vehicles/:vehicleId
```

예시:

```text
/vehicles/TRUCK-01
```

---

# 8. 차량 상세

## Route

```text
/vehicles/:vehicleId
```

## Access

```text
ADMIN
EMPLOYEE
```

## Purpose

특정 차량의 현재 운행 상태, 위치, 이동 경로와 ETA 정보를 상세하게 확인한다.

---

## Route Parameter

```text
vehicleId
```

차량을 식별하기 위한 고유 ID를 사용한다.

예시:

```text
/vehicles/TRUCK-01
```

---

## Main Information

### 차량 기본 정보

* 차량 ID
* 현재 상태
* 출발 Hub
* 도착 Hub

### ETA 정보

* 예상 도착 시간
* 지연 시간
* 예측 갱신 시간

가능한 경우:

* 예측 신뢰도
* 지연 사유

### 위치 정보

* 현재 위치
* 이동 경로
* 출발 위치
* 도착 Hub

가능한 경우:

* 남은 거리
* 예상 남은 이동 시간

---

## Access Scope

### ADMIN

전체 차량의 상세 정보를 확인할 수 있다.

### EMPLOYEE

자신의 Hub로 오는 차량의 상세 정보만 확인할 수 있다.

---

## Main Navigation

이 페이지에서 다음 화면으로 이동할 수 있다.

* 차량 관제
* 이전 화면

---

# 9. 중간 배송 투입 분석

## Route

```text
/delivery-analysis
```

## Access

```text
ADMIN
EMPLOYEE
```

## Purpose

막차 도착까지 남은 시간 동안 다른 배송 업무를 수행할 수 있는지 판단한다.

---

## ADMIN Questions

관리자는 다음 질문에 답할 수 있어야 한다.

* 현재 대기 인력을 다른 배송 업무에 투입할 수 있는가?
* 어느 Hub에서 대기 시간이 발생하고 있는가?
* 어떤 직원이 투입 가능한가?
* 투입한 직원이 막차 도착 전에 복귀할 수 있는가?

---

## EMPLOYEE Questions

현장 직원은 다음 질문에 답할 수 있어야 한다.

* 지금 대기하는 것이 유리한가?
* 중간 배송 업무를 수행하는 것이 유리한가?
* 업무 수행 후 막차 도착 전에 복귀할 수 있는가?

---

## Main Information

* 현재 시간
* 막차 ETA
* 남은 대기 시간
* 예상 작업 소요 시간
* 예상 복귀 시간
* 안전 여유 시간
* 투입 가능 여부

---

## ADMIN Scope

관리자는 다음 정보를 확인한다.

* Hub별 대기 상황
* 직원별 분석 결과
* 직원별 투입 가능 여부

---

## EMPLOYEE Scope

현장 직원은 다음 정보를 확인한다.

* 자신의 Hub 막차 ETA
* 자신의 남은 대기 시간
* 자신의 예상 작업 시간
* 자신의 예상 복귀 시간
* 자신의 투입 가능 여부

---

## Main Result

분석 결과는 다음 상태 중 하나로 표시한다.

```text
투입 가능
```

```text
투입 불가
```

결과와 함께 판단에 필요한 시간 정보를 표시한다.

---

# 10. 페이지 간 이동 구조

```text
/login
   │
   ├── ADMIN
   │      ↓
   │  /admin/dashboard
   │      ├── /vehicles
   │      │      └── /vehicles/:vehicleId
   │      └── /delivery-analysis
   │
   └── EMPLOYEE
          ↓
      /employee/dashboard
          ├── /vehicles
          │      └── /vehicles/:vehicleId
          └── /delivery-analysis
```

---

# 11. 페이지 책임 분리

## 대시보드

전체 상황을 빠르게 요약한다.

상세 분석 기능을 직접 수행하지 않는다.

---

## 차량 관제

여러 차량의 위치와 상태를 비교한다.

특정 차량의 모든 상세 정보를 한 화면에 표시하지 않는다.

---

## 차량 상세

하나의 차량에 대한 상세 정보를 확인한다.

전체 차량 비교 기능은 담당하지 않는다.

---

## 중간 배송 투입 분석

대기 시간과 업무 소요 시간을 기반으로 투입 가능 여부를 확인한다.

일반 차량 관제 기능은 담당하지 않는다.

---

# 12. 구현 시 주의 사항

* 문서에 정의되지 않은 주요 페이지를 임의로 추가하지 않는다.
* 동일한 기능을 여러 페이지에 중복 구현하지 않는다.
* 사용자 역할에 따라 데이터 조회 범위를 제한한다.
* EMPLOYEE 화면에 다른 Hub의 상세 정보를 노출하지 않는다.
* 차량 상세 페이지는 반드시 `vehicleId`를 기준으로 차량을 식별한다.
* 실제 인증이 없는 경우 Mock Login 로직과 실제 화면 코드를 분리한다.
* 각 페이지의 상세 UI는 `FRONTEND_SPEC.md`를 기준으로 구현한다.
