# Logistics Dashboard

물류 차량의 운행 상태, Hub 도착 ETA, 지연 상황을 모니터링하고
중간 배송 투입 가능 여부를 AI 분석으로 판단하는 데스크톱 우선 운영 대시보드입니다.

프론트엔드는 React, Vite, TypeScript 기반이며, 실제 API Gateway 및
Amazon Location Service와 연동되어 있습니다.

## 주요 목적

- 관리자가 전체 Hub와 전체 차량의 운행 상태를 빠르게 확인합니다.
- 현장 직원이 본인 소속 Hub로 도착하는 차량만 확인합니다.
- 차량 위치, ETA, 지연 시간, 마지막 차량 도착 시간을 운영 관점에서 표시합니다.
- 막차 도착까지 대기 시간 동안 중간 배송 투입 가능 여부를 AI가 분석합니다.

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router
- ESLint
- MapLibre GL + Amazon Location Service (지도 스타일, 경로 최적화, 도로 경로 계산)
- FM Chat API (AI 투입 분석, 운영 요약, 자연어 질문)

## 현재 구현 상태

| 화면 | Route | 상태 |
| --- | --- | --- |
| Login | `/login` | mock 로그인 UI |
| Admin Dashboard | `/admin/dashboard` | 실시간 API 연동 (허브/차량/ETA) |
| Employee Dashboard | `/employee/dashboard` | 실시간 API 연동 (직원 허브 범위) |
| Vehicle Monitoring | `/vehicles` | MapLibre 기반 차량/Hub 지도 및 목록 |
| Vehicle Detail | `/vehicles/:vehicleId` | placeholder |
| Delivery Analysis | `/delivery-analysis` | 실시간 API + FM AI 연동 (관리자/직원 뷰) |
| Route Optimization | `/route-optimization` | Amazon Location Service 경로 최적화 연동 |

`/delivery-analysis`는 관리자/직원 역할에 따라 다른 뷰를 제공하며,
실시간 차량 ETA와 FM Chat API를 연동하여 AI 투입 판단 결과를 표시합니다.

`/route-optimization`은 배송지 순서 최적화와 도로 경로 계산을 수행하며,
중간 배송 분석에서 FM 옵션 선택 시 자동으로 연결됩니다.

## 프로젝트 구조

```text
src/
├─ components/
│  ├─ dashboard/           # 대시보드 공통 표시 컴포넌트
│  ├─ delivery-analysis/   # 중간 배송 분석 관련 컴포넌트
│  ├─ layout/              # AppShell, Sidebar, Header, PageHeader
│  ├─ map/                 # AmazonMap 래퍼
│  ├─ ui/                  # Button, Card, StatusBadge
│  └─ vehicles/            # 차량 지도 및 관제 UI
├─ contexts/               # AuthContext
├─ hooks/                  # MapLibre 초기화, 차량 애니메이션 hook
├─ mocks/                  # 차량, Hub, 배송 분석 mock data
├─ pages/                  # 라우트 단위 페이지
├─ services/               # UI와 data source 사이의 service layer
├─ types/                  # 공유 domain type
└─ utils/                  # 데모 시간, 지도, 주소 유틸리티
```

## 데이터 흐름

화면 컴포넌트는 mock data를 직접 import하지 않고 service layer를 통해 데이터를
받습니다.

```text
Page / Component
  -> service
  -> API Gateway (실시간) 또는 mock data (fallback)
```

대부분의 페이지는 실제 API Gateway를 통해 데이터를 받으며,
API 연결 실패 시 mock data로 graceful fallback합니다.

```text
getVehicles() → API Gateway → Lambda → DynamoDB
getHubs() → API Gateway → Lambda → DynamoDB
requestOptimization() → FM Chat API → AI 분석 결과
optimizeWaypoints() → Amazon Location Service → 경로 최적화
```

## 역할과 데이터 범위

지원 역할은 두 가지입니다.

- `ADMIN`: 전체 Hub와 전체 차량 정보를 조회합니다.
- `EMPLOYEE`: 본인 소속 Hub로 도착하는 차량 정보만 조회합니다.

차량 상태 값은 다음 세 가지를 사용합니다.

- `ARRIVED`: 도착
- `IN_TRANSIT`: 운행 중
- `DELAYED`: 지연

도메인 식별자는 `vehicleId`, `hubId`, `employeeId` 명명 규칙을 따릅니다.

## 실행 방법

```bash
npm install
npm run dev
```

기본 Vite 개발 서버에서 실행됩니다.

빌드:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Preview:

```bash
npm run preview
```

## 환경 변수

지도, Amazon Location Service, API Gateway 연동을 위해 `.env.local`에 다음 값을
설정합니다.

```env
VITE_AWS_REGION=ap-northeast-2
VITE_AMAZON_LOCATION_API_KEY=your_api_key
VITE_API_BASE_URL=https://your-api-gateway-url/prod
```

- `VITE_AWS_REGION`, `VITE_AMAZON_LOCATION_API_KEY`: 지도 스타일 및 경로 API 호출에 필요
- `VITE_API_BASE_URL`: 차량, 허브, ETA, 직원, 배송지, Chat API 엔드포인트

환경 변수가 없으면 Amazon 지도 컴포넌트는 오류 상태를 표시하고,
API 호출은 mock data fallback으로 동작합니다.

## 문서

구현 전후로 다음 문서를 기준으로 확인합니다.

- `docs/FRONTEND_SPEC.md`: 화면 동작과 UI 요구사항
- `docs/PAGES.md`: 라우트, 접근 권한, 페이지 책임
- `docs/DESIGN_SYSTEM.md`: 시각 방향과 공통 UI 규칙
- `docs/API_CONTRACT.md`: API 계약 초안
- `docs/DATA_MODELS.md`: 공유 도메인 모델 초안

현재 `API_CONTRACT.md`와 `DATA_MODELS.md`는 draft 상태이므로, 확정되지 않은
백엔드 동작은 frontend에서 임의로 단정하지 않습니다.

## 개발 원칙

- mock data는 `src/mocks`에 두고, `src/services`를 통해 접근합니다.
- UI 컴포넌트 안에 큰 mock dataset을 직접 작성하지 않습니다.
- AWS 서비스는 API Gateway를 통해 접근하는 것을 기본 구조로 합니다.
  Amazon Location Service(경로 최적화)는 프론트엔드에서 직접 호출합니다.
- 인증 후 화면은 `AppShell`, `Sidebar`, `TopHeader`, `PageHeader` 등 공통 레이아웃을
  재사용합니다.
- 운영 대시보드이므로 큰 hero, 과한 gradient, 장식적 animation은 피하고
  정보 인식과 밀도를 우선합니다.
- loading, error, empty 상태를 빈 화면으로 방치하지 않습니다.

## 참고 사항

- 데모 모드 시간은 `src/utils/demoTime.ts`에서 고정 시점 기준으로 동작합니다.
- 로그인은 현재 mock 인증이며, 역할(ADMIN/EMPLOYEE)을 선택하여 진입합니다.
- 연동 상세 현황은 `docs/INTEGRATION_STATUS.md`를 참고하세요.
