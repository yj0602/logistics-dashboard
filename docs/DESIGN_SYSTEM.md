# Design System

## 1. Purpose

This document defines the visual direction and reusable UI rules for the logistics control dashboard.

All newly implemented pages must visually match the approved reference screens and feel like part of the same product.

Detailed page behavior is defined in:

- `FRONTEND_SPEC.md`
- `PAGES.md`

This document focuses only on visual consistency and UI composition.

---

# 2. Design Direction

The application is a professional logistics operations dashboard.

The visual style should be:

- Professional
- Operational
- Data-focused
- Clean
- Compact
- Modern
- Consistent

The interface should resemble a real logistics monitoring and control system.

Prioritize:

- Fast information recognition
- Operational clarity
- Readability
- Consistent status presentation
- Efficient use of screen space

Do not design authenticated pages like:

- Marketing websites
- Landing pages
- Decorative SaaS templates
- Mobile-first consumer applications

---

# 3. Visual References

Approved reference images are stored in:

```text
docs/references/
````

Before implementing or significantly modifying UI, review the relevant reference images.

Use reference images to understand:

* Overall visual hierarchy
* Sidebar appearance
* Header structure
* Layout density
* Card style
* Table style
* Status colors
* Map layout
* Panel proportions
* Spacing

Reference images define the preferred visual direction.

Do not copy sample text or mock data blindly.

Use them as visual references, not as exact data requirements.

When visual decisions are unclear, prioritize:

1. Approved reference images
2. Existing implemented shared components
3. This `DESIGN_SYSTEM.md`
4. `FRONTEND_SPEC.md`

Do not redesign an approved visual pattern without explicit instruction.

---

# 4. Application Layout

Authenticated pages use a common application shell.

Recommended structure:

```text
┌───────────────┬──────────────────────────────────────────────┐
│               │ Top Header                                   │
│ Sidebar       ├──────────────────────────────────────────────┤
│               │                                              │
│               │ Main Content                                 │
│               │                                              │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

The authenticated application should consistently reuse:

* Sidebar
* Top header
* Page title area
* Content spacing
* Status components
* Card styling

Do not create a different application shell for individual pages.

---

# 5. Sidebar

The sidebar is a core visual element of the application.

Use:

* Dark navy background
* White or light navigation text
* Blue active navigation state
* Consistent icon style
* Vertical navigation structure

The sidebar should include:

* Service name or logo
* Main navigation
* Current page highlight
* Logout action near the bottom

Recommended width:

```text
180px - 220px
```

The sidebar should remain visually stable across authenticated pages.

Do not:

* Change sidebar color between pages
* Change sidebar width without a clear reason
* Use multiple sidebar designs
* Use excessively large navigation items

---

# 6. Top Header

The top header should remain compact and lightweight.

It may include:

* Page title
* ADMIN / EMPLOYEE mode switch
* Current time
* Notification indicator
* User profile
* Current role

The header should support quick status recognition without occupying excessive vertical space.

Do not create:

* Large marketing-style headers
* Hero sections
* Oversized profile areas

---

# 7. Main Content Area

Use:

* Very light gray or off-white page background
* White content surfaces
* Clear separation between sections
* Compact operational layout

The main content should fit efficiently within desktop screens.

Primary target:

```text
1440px and wider
```

Minimum development target:

```text
approximately 1280px
```

Mobile optimization is not currently a core requirement.

---

# 8. Color System

Use a restrained enterprise color palette.

## Primary Color

Use blue for:

* Primary buttons
* Active navigation
* Selected filters
* Selected rows
* Important interactions
* Active map states

Avoid introducing unrelated primary colors.

---

## Sidebar Color

Use dark navy.

The sidebar should provide strong contrast against the main content area.

---

## Surface Colors

Use:

```text
Page Background
Very light gray or off-white

Content Surface
White
```

---

## Status Colors

Status colors must remain consistent across all pages.

### Green

Use for:

* Normal operation
* Available
* Arrival complete
* Recommended action
* Successful result

### Red

Use for:

* Delay
* Critical issue
* Serious alert
* Unavailable state

### Orange

Use for:

* Warning
* Approaching Hub
* Conditional state
* Arrival soon

### Blue

Use for:

* In transit
* Active tracking
* Informational state

### Gray

Use for:

* Inactive state
* Disabled controls
* Secondary metadata
* Completed or unavailable interaction states

Do not communicate state through color alone.

Always include a text label.

---

# 9. Typography

Use one consistent modern Korean sans-serif font.

Preferred characteristics:

* Strong Korean readability
* Clear numeric display
* Neutral enterprise appearance

Recommended hierarchy:

## Page Title

```text
24px - 32px
```

Bold, but not oversized.

## Section Title

```text
16px - 20px
```

## Body Text

```text
13px - 16px
```

## Secondary Text

```text
12px - 14px
```

Important operational values may use stronger emphasis:

* ETA
* Delay time
* Vehicle count
* Waiting time
* Remaining time
* Recommendation result

Do not use excessively large typography in authenticated application pages.

---

# 10. Spacing and Density

The interface should be compact but readable.

Use spacing that:

* Clearly separates functional areas
* Allows multiple data sections on one screen
* Avoids oversized empty regions
* Preserves fast scanning

Prefer information density suitable for an operations dashboard.

Avoid excessive:

* Vertical spacing
* Oversized cards
* Empty areas
* Decorative padding

---

# 11. Border and Radius

Use:

* Thin light-gray borders
* Moderate border radius
* Subtle visual separation

Recommended border radius:

```text
8px - 14px
```

Use pill-shaped elements mainly for:

* Status badges
* Filter controls
* Mode switches
* Small tags

Do not make all components excessively rounded.

---

# 12. Shadows

Use subtle shadows only when they improve hierarchy.

Suitable for:

* Main panels
* Floating detail panels
* Large content containers
* Important overlays

Avoid:

* Heavy shadows
* Strong floating-card effects
* Glassmorphism

Borders should usually provide the primary separation between sections.

---

# 13. Cards

Cards should be used for meaningful information grouping.

Typical card style:

* White background
* Thin gray border
* Moderate radius
* Compact padding
* Optional subtle shadow

Use cards for:

* Summary metrics
* Analysis results
* Operational grouping
* Key status blocks

Do not turn every item into an individual card.

---

# 14. Summary Metrics

Dashboard summary metrics should be easy to scan.

Each summary item should generally include:

* Small icon
* Short label
* Main numeric value
* Optional supporting description

Examples:

```text
전체 차량
12대
```

```text
지연 차량
1대
```

```text
예상 막차 ETA
06:12
```

Cards should use consistent height, spacing, and value hierarchy.

---

# 15. Status Badges

Status badges should remain compact.

Examples:

```text
정상
운행 중
지연
도착 임박
도착 완료
```

Use:

* Small internal padding
* Light tinted background
* Matching text color
* Compact rounded corners

Do not display status as a large button.

---

# 16. Tables and Lists

Operational data should be easy to scan quickly.

Use:

* Compact rows
* Clear column alignment
* Light row separators
* Minimal decoration
* Consistent numeric alignment

Typical data includes:

* Vehicle ID
* Route
* ETA
* Delay
* Status

Selected rows may use:

* Subtle background highlight
* Colored border
* Stronger text

Do not use oversized rows.

---

# 17. Buttons

## Primary Button

Use primary blue.

Examples:

* 로그인
* 확인
* 상세 보기
* 경로 전체 보기

## Secondary Button

Use:

* White background
* Light gray border
* Dark text

## Critical Action

Use red only when the action itself is:

* Destructive
* Dangerous
* Irreversible

Do not use red ordinary action buttons merely because the current vehicle is delayed.

---

# 18. Icons

Use one consistent icon library.

Icons should be:

* Simple
* Modern
* Clear at small sizes
* Visually consistent

Do not:

* Mix unrelated icon styles
* Use emoji as interface icons
* Use decorative icons without functional value

---

# 19. Dashboard Screens

Dashboard screens should prioritize:

1. Current operational summary
2. Vehicle or Hub problems
3. Important alerts
4. Recommended actions

The user should quickly understand:

* Whether there is a problem
* Which vehicle is delayed
* When the last vehicle will arrive
* Whether additional delivery work is possible

Avoid placing secondary information above core operational metrics.

---

# 20. Map Screens

Map-centered pages should prioritize the map.

Recommended structure:

```text
┌──────────────┬───────────────────────────────┬──────────────┐
│ Filter/List  │ Map                           │ Detail Panel │
└──────────────┴───────────────────────────────┴──────────────┘
```

The map should usually occupy the largest portion of the screen.

Use supporting panels for:

* Vehicle filters
* Vehicle list
* Search
* Selected vehicle information

Map markers should distinguish:

* Normal vehicle
* Delayed vehicle
* Approaching vehicle
* Arrived vehicle
* Hub
* Selected vehicle

Use the same status color rules as the rest of the application.

The selected vehicle should be clearly emphasized.

---

# 21. Alert Screens

Alert screens should clearly communicate severity.

Use:

* Red for serious delay
* Orange for warning
* Green for resolved or completed state

Alert items should include relevant information such as:

* Alert type
* Vehicle ID
* Route
* Time
* Status
* Important operational metrics

A selected alert may open a detail panel on the right.

Prefer persistent side panels over unnecessary modal windows.

---

# 22. Analysis Screens

Analysis screens should visually explain the decision process.

Recommended order:

```text
Current Situation
        ↓
Option Comparison
        ↓
Calculation Summary
        ↓
Final Recommendation
```

The final recommendation should be visually prominent.

Possible results include:

```text
투입 추천
투입 가능
투입 불가
조건부 투입
```

Do not show only the recommendation.

Also display the supporting values used to reach the result.

Examples:

* Available time
* Expected work time
* Return time
* Safety margin
* Remaining time

---

# 23. Login Screen

The login page may use a different layout from authenticated pages.

Recommended structure:

```text
┌────────────────────────┬────────────────────────┐
│ Product Introduction   │ Login Form             │
└────────────────────────┴────────────────────────┘
```

The introduction area may use:

* Blue or navy background
* Logistics illustration
* Product summary
* Key service benefits

The login form area should remain:

* White
* Clean
* Simple
* Centered

Do not use the authenticated sidebar layout on the login page.

---

# 24. Reusable UI Rules

When implementing a new page, reuse existing components where practical.

Reuse:

* Sidebar
* Header
* Page title area
* Summary metric cards
* Status badges
* Tables
* Buttons
* Filter controls
* Detail panels
* Alert items

Do not create slightly different copies of the same UI pattern for each page.

---

# 25. Consistency Rules

All pages should use the same:

* Sidebar
* Header structure
* Primary color
* Status colors
* Typography hierarchy
* Border style
* Radius scale
* Table density
* Button hierarchy
* Icon style

A newly implemented page should immediately look like part of the existing logistics control system.

---

# 26. Prohibited Visual Patterns

Do not use:

* Large hero sections inside authenticated pages
* Heavy gradients
* Glassmorphism
* Neon colors
* Excessive animations
* Oversized cards
* Excessive whitespace
* Generic landing-page sections
* Random accent colors
* Multiple unrelated icon styles
* Different status colors between pages
* Different sidebar designs between pages
* Page-specific design systems

The application must remain one coherent logistics control product.

---

# 27. Implementation Checklist

Before considering a UI task complete, verify:

* The page visually matches the approved reference screens.
* Existing shared layout components were reused.
* Status colors are consistent.
* Button hierarchy is consistent.
* Typography matches existing pages.
* Spacing is compact and operational.
* Important values are visually emphasized.
* No unrelated design style was introduced.
* The page looks like part of the same product.

````