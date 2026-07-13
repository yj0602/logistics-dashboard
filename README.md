# Logistics Dashboard

물류 차량의 운행 상태, Hub 도착 ETA, 지연 상황을 모니터링하기 위한
데스크톱 우선 운영 대시보드입니다.

현재 프론트엔드는 React, Vite, TypeScript 기반으로 구현되어 있으며,
백엔드 API가 확정되기 전까지 mock data와 service layer를 통해 화면을
구성합니다.

## 주요 목적

- 관리자가 전체 Hub와 전체 차량의 운행 상태를 빠르게 확인합니다.
- 현장 직원이 본인 소속 Hub로 도착하는 차량만 확인합니다.
- 차량 위치, ETA, 지연 시간, 마지막 차량 도착 시간을 운영 관점에서 표시합니다.
- 향후 중간 배송 투입 분석과 실제 API Gateway 연동을 교체 가능하게 준비합니다.

## 기술 스택

- React 19
- TypeScript
- Vite
- React Router
- ESLint
- MapLibre GL
- Amazon Location Service API key 기반 지도 스타일 및 경로 API 연동 준비

## 현재 구현 상태

| 화면 | Route | 상태 |
| --- | --- | --- |
| Login | `/login` | mock 로그인 UI |
| Admin Dashboard | `/admin/dashboard` | mock data 기반 구현 |
| Employee Dashboard | `/employee/dashboard` | 직원 Hub 범위 mock data 기반 구현 |
| Vehicle Monitoring | `/vehicles` | MapLibre 기반 차량/Hub 지도 및 목록 구현 |
| Vehicle Detail | `/vehicles/:vehicleId` | placeholder |
| Intermediate Delivery Analysis | `/delivery-analysis` | placeholder |
| Route Optimization | `/route-optimization` | mock 입력 기반 경로 최적화 화면, 실제 운영 데이터 연동 전 |

`/route-optimization`은 아직 실제 배송 데이터나 백엔드 API와 연결되지 않았으며,
mock 입력을 사용해 경로 최적화 흐름과 Amazon Location Service
`OptimizeWaypoints`, `CalculateRoutes` 호출 구조를 확인하는 화면입니다.

## 프로젝트 구조

```text
src/
├─ assets/                 # 정적 이미지 자산
├─ components/
│  ├─ dashboard/           # 대시보드 공통 표시 컴포넌트
│  ├─ layout/              # AppShell, Sidebar, Header, PageHeader
│  ├─ map/                 # AmazonMap 래퍼
│  ├─ ui/                  # Button, Card, StatusBadge
│  └─ vehicles/            # 차량 지도 및 관제 UI
├─ hooks/                  # MapLibre 초기화 등 공통 hook
├─ mocks/                  # 차량, Hub, 경로 최적화 mock data
├─ pages/                  # 라우트 단위 페이지
├─ services/               # UI와 data source 사이의 service layer
└─ types/                  # 공유 domain type
```

## 데이터 흐름

화면 컴포넌트는 mock data를 직접 import하지 않고 service layer를 통해 데이터를
받는 구조를 지향합니다.

```text
Page / Component
  -> service
  -> mock data
```

향후 실제 API가 준비되면 service 구현만 API Gateway 호출로 교체하고,
페이지 컴포넌트의 변경은 최소화하는 것이 목표입니다.

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

지도 및 Amazon Location Service 검증 기능을 사용하려면 `.env.local`에 다음 값을
설정합니다.

```env
VITE_AWS_REGION=ap-northeast-2
VITE_AMAZON_LOCATION_API_KEY=your_api_key
```

환경 변수가 없으면 Amazon 지도 컴포넌트는 오류 상태를 표시합니다.

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

- mock data는 `src/mocks`에 두고, 가능한 한 `src/services`를 통해 접근합니다.
- UI 컴포넌트 안에 큰 mock dataset을 직접 작성하지 않습니다.
- 실제 AWS 서비스는 프론트엔드에서 직접 호출하지 않고 API Gateway를 통한 구조를
  기본 전제로 합니다. 단, 현재 `/route-optimization` 화면은 실제 데이터 연동 전
  경로 최적화 호출 흐름을 검증하기 위한 예외적 mock 기반 화면입니다.
- 인증 후 화면은 `AppShell`, `Sidebar`, `TopHeader`, `PageHeader` 등 공통 레이아웃을
  재사용합니다.
- 운영 대시보드이므로 큰 hero, 과한 gradient, 장식적 animation은 피하고
  정보 인식과 밀도를 우선합니다.
- loading, error, empty 상태를 빈 화면으로 방치하지 않습니다.

## 참고 사항

현재 일부 기존 문서와 소스의 한글 문자열은 인코딩 문제로 깨져 보일 수 있습니다.
새로 작성하거나 수정하는 문서는 UTF-8 기준의 한국어 텍스트를 사용합니다.
