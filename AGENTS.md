# Project Instructions

## 1. Project Overview

This project is a desktop-first web dashboard for monitoring logistics vehicles, predicting vehicle arrival times at hubs, and supporting operational decisions during delivery delays.

The frontend should help:

* Administrators monitor all hubs and vehicles.
* Field employees monitor vehicles arriving at their assigned hub.
* Users understand vehicle locations, ETA, delays, and last-vehicle arrival times.
* Users determine whether waiting employees can perform intermediate delivery work before the last vehicle arrives.

---

## 2. Required Documentation

Before implementing or modifying a page, read the relevant project documentation.

Required documents:

* `docs/FRONTEND_SPEC.md`
* `docs/PAGES.md`

When working with API data, also read:

* `docs/API_CONTRACT.md`

When working with shared domain models, also read:

* `docs/DATA_MODELS.md`

When implementing or modifying UI, also read:

- `docs/DESIGN_SYSTEM.md`

Review the relevant images in `docs/references/` before implementing major UI screens.

Do not invent pages, features, fields, user roles, API responses, or business rules that conflict with these documents.

If a referenced document does not exist yet:

* Do not create backend behavior based on assumptions.
* Use clearly separated mock data when necessary.
* Follow the existing frontend specification and page definitions.
* Do not block unrelated frontend implementation solely because an API document is not yet available.

---

## 3. Documentation Priority

When instructions appear to conflict, use the following priority:

1. The user's latest explicit request
2. `docs/API_CONTRACT.md` for API request and response structures
3. `docs/DATA_MODELS.md` for shared domain types
4. `docs/FRONTEND_SPEC.md` for detailed screen behavior and UI requirements
5. `docs/PAGES.md` for routes, access roles, and page responsibilities
6. This `AGENTS.md` file
7. Existing implementation conventions

Do not silently resolve important conflicts by inventing new behavior.

---

## 4. Tech Stack

Use the following technologies:

* React
* Vite
* TypeScript
* React Router
* REST API
* ESLint

Amazon Location Service may be used for production map integration.

Until map integration is implemented, use a clearly separated placeholder or mock map implementation.

Use the existing package manager and project conventions.

Do not replace the current framework, package manager, or major project structure unless explicitly requested.

---

## 5. Main Pages

The application contains these main pages:

1. Login
2. Admin Dashboard
3. Employee Dashboard
4. Vehicle Monitoring
5. Vehicle Detail
6. Intermediate Delivery Analysis

Use the exact routes, access roles, and responsibilities defined in `docs/PAGES.md`.

Do not add major pages without updating the documentation first.

---

## 6. User Roles

There are exactly two application roles:

* `ADMIN`
* `EMPLOYEE`

### ADMIN

ADMIN can view:

* All hubs
* All vehicles
* All employees
* Overall logistics status
* Hub-level operating status
* Employee-level intermediate delivery analysis

### EMPLOYEE

EMPLOYEE can view:

* Their assigned hub
* Vehicles arriving at their assigned hub
* ETA and delay information for those vehicles
* Their own intermediate delivery analysis

Do not expose administrator-only information on employee screens.

Do not expose information about unrelated hubs or other employees on employee screens.

---

## 7. Domain Naming Rules

Use consistent domain names across the entire frontend.

Preferred identifiers:

* `vehicleId`
* `hubId`
* `employeeId`

Do not mix equivalent names such as:

* `vehicleId` and `truckId`
* `hubId` and `centerId`
* `employeeId` and `workerId`

Use existing documented names unless explicitly changed.

---

## 8. Vehicle Status Rules

Vehicle status values are:

* `ARRIVED`: 도착
* `IN_TRANSIT`: 운행 중
* `DELAYED`: 지연

Use the exact status codes above in TypeScript types and data models.

Do not create additional vehicle statuses without updating the relevant documentation and data model.

Status labels and visual treatment must remain consistent across all pages.

Do not communicate status through color alone.

---

## 9. UI Rules

This is a desktop-first logistics operations dashboard.

Prioritize:

* Fast information recognition
* Readability
* Clear operational status
* Consistent data presentation
* Efficient use of screen space

Avoid:

* Excessive gradients
* Large hero sections
* Landing-page-style layouts
* Decorative animations that do not improve usability
* Excessive card usage
* Oversized headings
* Unnecessary visual effects

Reuse shared layout and UI components when the same pattern appears across multiple pages.

Do not redesign unrelated screens while implementing a single requested feature.

---

## 10. Responsive Scope

Primary target:

* Desktop displays
* 1440px and wider

Minimum supported development target:

* Approximately 1280px wide laptop displays

Mobile optimization is not currently a core project requirement.

Do not significantly delay desktop implementation to build mobile-specific layouts unless explicitly requested.

---

## 11. TypeScript Rules

Use TypeScript for all new frontend source files.

Define shared domain types separately from UI components.

Recommended structure:

```text
src/
├─ types/
│  ├─ vehicle.ts
│  ├─ hub.ts
│  ├─ employee.ts
│  └─ eta.ts
```

Use documented data structures as the source of truth.

Do not use `any` when a meaningful type can reasonably be defined.

Do not duplicate the same interface in multiple components.

Prefer shared types for:

* API responses
* Mock data
* Component props
* Domain entities

---

## 12. Implementation Rules

Before coding a requested page or feature:

1. Read the relevant section of `docs/FRONTEND_SPEC.md`.
2. Check the route and page responsibility in `docs/PAGES.md`.
3. Check relevant types and API contracts when available.
4. Inspect existing reusable components before creating new ones.
5. Implement only the requested scope.
6. Preserve unrelated working code.
7. Use mock data when the required API is not available.
8. Keep mock data separate from UI components.
9. Run relevant checks before considering the task complete.

Do not:

* Rewrite unrelated files.
* Refactor the entire project during a small task.
* Invent backend behavior.
* Add undocumented business rules.
* Create duplicate components when an existing shared component can reasonably be reused.
* Replace working project structure without explicit instruction.

---

## 13. Incremental Development Rules

Implement the project incrementally.

Preferred order:

1. Shared project structure
2. Routing
3. Shared TypeScript types
4. Shared layout
5. Mock data
6. Individual pages
7. API integration
8. Amazon Location Service integration
9. Loading, error, and empty states
10. Final consistency review

Do not attempt to build the entire project in one large change unless explicitly requested.

For a page-specific request, modify only:

* The requested page
* Required shared components
* Required types
* Required mock data
* Required styles

Avoid unrelated changes.

---

## 14. Mock Data Rules

The frontend will be developed primarily with mock data until AWS APIs and AI integrations are available.

Mock-first development is expected and is not considered temporary or incomplete frontend work.

The frontend should be fully implementable and demonstrable using mock data.

### Data Flow

Pages and UI components should not depend directly on mock data files.

Use the following structure:

```text
Page / Component
        ↓
Service or Data Access Layer
        ↓
Mock Data
```

Later, when real APIs become available:

```text
Page / Component
        ↓
Service or Data Access Layer
        ↓
API Gateway
```

The goal is to replace the data source without rewriting page components.

---

### Recommended Structure

```text
src/
├─ mocks/
│  ├─ vehicles.ts
│  ├─ hubs.ts
│  ├─ employees.ts
│  ├─ eta.ts
│  └─ dashboard.ts
│
├─ services/
│  ├─ vehicleService.ts
│  ├─ hubService.ts
│  ├─ dashboardService.ts
│  └─ analysisService.ts
```

---

### Implementation Rules

When an API is not available:

* Use mock data instead of blocking frontend implementation.
* Build the complete UI and interaction flow using mock data.
* Keep mock data outside page and UI components.
* Access mock data through service functions when practical.
* Make service functions asynchronous when they are expected to be replaced by API calls.
* Keep mock field names consistent with `DATA_MODELS.md` and `API_CONTRACT.md`.
* Use realistic data that demonstrates normal, delayed, loading, empty, and error states where relevant.

Do not:

* Hardcode large datasets inside page components.
* Scatter duplicate mock data across multiple files.
* Invent undocumented backend endpoints.
* Pretend mock data is real API data.
* Rewrite completed pages when replacing mock data with real API responses.

---

## Current Implementation Scope

The current frontend implementation priority is limited to:

0. login ui
1. Admin Dashboard
2. Employee Dashboard
3. Vehicle Monitoring / Real-time Map

These screens should be implemented first and may use mock data.

The following areas are intentionally deferred until their AWS, AI, backend, or business logic is clarified:

- Intermediate Delivery Analysis
- Delivery Candidate Comparison
- Statistics
- Advanced Alert Management
- Other features whose real behavior is not yet confirmed

For deferred pages:

- Keep the route if it is already defined.
- Keep the navigation item if required by the planned product structure.
- Use a minimal placeholder when necessary.
- Do not implement detailed UI or fake functionality.
- Do not infer complete behavior only from reference images.

Reference images for deferred pages represent future visual direction only.

--

### Example

Preferred:

```ts
const vehicles = await getVehicles();
```

The page should not need to know whether `getVehicles()` currently uses mock data or a real API.

Current implementation:

```text
getVehicles()
    ↓
mockVehicles
```

Future implementation:

```text
getVehicles()
    ↓
API Gateway
```

Only the data access implementation should change when the real API becomes available.

---

### Partial Integration

The project may use a mixed implementation during development and demonstration.

For example:

* Some data may come from real AWS APIs.
* Some data may come from SageMaker prediction results.
* Some data may remain mock data for demonstration purposes.

Do not require all frontend data sources to become real APIs at the same time.

Keep real and mock data sources clearly separated in the codebase.

---

## 15. API Rules

Frontend code must not directly call:

* Amazon SageMaker
* AWS Lambda
* Amazon Kinesis Data Streams
* Amazon S3

Application data is accessed through API Gateway endpoints.

Expected architecture:

```text
Frontend
   ↓
API Gateway
   ↓
Lambda
   ↓
AWS Services
```

Frontend API calls should be isolated from UI components.

Recommended structure:

```text
src/
├─ services/
│  ├─ vehicleService.ts
│  ├─ dashboardService.ts
│  └─ analysisService.ts
```

Do not place raw API request logic directly throughout multiple page components.

---

## 16. ETA Data Rules

Core ETA prediction fields include:

* `vehicleId`
* `estimatedArrivalTime`
* `delayMinutes`
* `predictionUpdatedAt`

Optional fields may include:

* `confidence`
* `delayReason`

Use `docs/API_CONTRACT.md` as the source of truth for exact request and response structures when the document exists.

Do not rename ETA fields inside individual pages.

---

## 17. Map Rules

The vehicle monitoring and vehicle detail pages may display:

* Vehicle current locations
* Hub locations
* Vehicle routes
* Selected vehicle state

Amazon Location Service is the intended AWS map service.

Until actual integration is requested:

* Keep map-specific logic isolated.
* Do not fake production AWS integration.
* A placeholder or mock map implementation may be used.
* Do not hardcode AWS credentials in frontend source code.

---

## 18. Loading, Error, and Empty States

Pages that depend on data must consider:

* Loading state
* Error state
* Empty state
* Successful data state

Do not leave the main content area blank when data is unavailable.

Do not rely only on console errors for API failures.

Examples:

```text
차량 정보를 불러오는 중입니다.
```

```text
차량 정보를 불러오지 못했습니다.
```

```text
현재 지연 차량이 없습니다.
```

---

## 19. Code Quality Rules

Before completing an implementation:

* Check for TypeScript errors.
* Check for ESLint errors.
* Remove unused imports.
* Remove unnecessary debug logs.
* Verify that routes still work.
* Verify that unrelated pages were not broken.

Do not disable TypeScript or ESLint rules merely to hide an error unless there is a documented reason.

---

## 20. Final Review Checklist

Before considering a requested task complete, verify:

* The implementation matches the relevant documentation.
* The requested scope is fully implemented.
* No unrelated features were changed.
* User role restrictions remain correct.
* Shared data fields use consistent names.
* Mock data is separated from UI components.
* Loading, error, and empty states are handled where relevant.
* TypeScript and ESLint checks pass.
