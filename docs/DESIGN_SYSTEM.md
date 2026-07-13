# Design System

## 1. Purpose

This document defines the visual system and reusable UI rules for the logistics operations dashboard.

All authenticated pages must look and behave as parts of one operational product.

This document controls:

* Application layout
* Visual hierarchy
* Typography
* Color usage
* Spacing
* Panels and surfaces
* Tables and lists
* Status presentation
* Map composition
* Reusable component styling

Detailed page behavior and data requirements are defined in:

* `FRONTEND_SPEC.md`
* `PAGES.md`
* `API_CONTRACT.md`

This document must not introduce or override business logic, API fields, user permissions, or page behavior.

---

# 2. Design Objective

The product is an enterprise logistics monitoring and control system.

The interface must feel:

* Operational
* Reliable
* Precise
* Data-focused
* Compact
* Contemporary
* Calm
* Consistent

The interface should look refined because of:

* Strong alignment
* Clear hierarchy
* Consistent spacing
* Restrained color usage
* High-quality typography
* Deliberate proportions
* Accurate component states

It must not depend on decoration to appear modern.

The target visual direction is:

```text
Enterprise logistics control console
Fleet monitoring application
Operations command center
Professional internal admin tool
```

The target visual direction is not:

```text
Generic AI-generated dashboard
Startup landing page
Marketing SaaS template
Consumer mobile application
Decorative analytics showcase
```

---

# 3. Core Visual Principles

## 3.1 Function Before Decoration

Every visual element must support one of the following:

* Information recognition
* Status identification
* Navigation
* Filtering
* Comparison
* Decision-making
* User action

Do not add visual elements only to make empty space appear more decorative.

Avoid:

* Abstract background shapes
* Decorative illustrations
* Unnecessary icon containers
* Glow effects
* Large promotional copy
* Decorative charts without operational value

---

## 3.2 Flat, Structured Composition

Use a predominantly flat interface.

Create hierarchy through:

1. Layout
2. Typography
3. Alignment
4. Border separation
5. Surface contrast
6. Spacing

Do not create hierarchy primarily through:

* Heavy shadows
* Large gradients
* Floating cards
* Different colors for every section
* Excessive border radius

---

## 3.3 Restrained Visual Language

Use fewer visual styles, but apply them consistently.

The interface should have:

* One primary accent color
* One sidebar treatment
* One panel style
* One table style
* One button hierarchy
* One status system
* One typography scale
* One spacing scale

Do not create page-specific visual systems.

---

## 3.4 Operational Density

The dashboard must display multiple useful information areas without feeling crowded.

Prioritize:

* Compact controls
* Short labels
* Clear numeric values
* Scannable rows
* Stable panel dimensions
* Limited decorative spacing

Do not optimize authenticated pages for large empty regions or presentation-style layouts.

---

# 4. Reference Priority

Approved visual references are stored in:

```text
docs/references/
```

Before implementing or significantly modifying a page:

1. Inspect the relevant reference images.
2. Identify their layout structure.
3. Identify panel proportions.
4. Identify visual density.
5. Identify table and card treatment.
6. Compare the current implementation with the references.
7. Modify only the patterns that require adjustment.

When visual rules conflict, use the following priority:

1. Explicit task instructions
2. Approved reference images
3. Existing shared components
4. This `DESIGN_SYSTEM.md`
5. General implementation conventions

Do not replace an approved pattern merely because another design appears more visually impressive.

Do not apply generic dashboard conventions without first checking the references.

---

# 5. Design Tokens

Use shared design tokens instead of arbitrary values.

Recommended CSS variables:

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  --color-navy-800: #172033;
  --color-navy-900: #101828;
  --color-navy-950: #0b1220;

  --color-gray-25: #fcfcfd;
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;

  --color-success-50: #f0fdf4;
  --color-success-100: #dcfce7;
  --color-success-600: #16a34a;
  --color-success-700: #15803d;

  --color-warning-50: #fff7ed;
  --color-warning-100: #ffedd5;
  --color-warning-600: #ea580c;
  --color-warning-700: #c2410c;

  --color-danger-50: #fef2f2;
  --color-danger-100: #fee2e2;
  --color-danger-600: #dc2626;
  --color-danger-700: #b91c1c;

  --color-info-50: #eff6ff;
  --color-info-100: #dbeafe;
  --color-info-600: #2563eb;
  --color-info-700: #1d4ed8;

  --page-background: #f4f6f8;
  --surface-default: #ffffff;
  --surface-subtle: #f8fafc;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-disabled: #94a3b8;

  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  --shadow-overlay: 0 8px 24px rgba(15, 23, 42, 0.14);
}
```

Do not introduce arbitrary colors, radius values, shadows, or spacing values unless required by a specific component.

---

# 6. Application Shell

Authenticated pages must use one shared application shell.

```text
┌──────────────┬───────────────────────────────────────────────┐
│              │ Top Header                                    │
│ Sidebar      ├───────────────────────────────────────────────┤
│              │                                               │
│              │ Main Content                                  │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

The shared shell must include:

* Sidebar
* Top header
* Main content container
* Shared page title structure
* Shared content spacing
* Shared responsive behavior

Do not create separate authenticated layouts for individual pages.

---

# 7. Sidebar

The sidebar is a stable navigation structure, not a decorative panel.

## Dimensions

```text
Expanded width: 208px
Collapsed width, when supported: 64px
```

Do not use widths outside this range without a functional reason.

## Styling

Use:

* Solid dark navy background
* Light navigation text
* Muted inactive icons
* Blue active indicator
* Compact vertical spacing
* Consistent icon size

Recommended values:

```text
Navigation item height: 40px
Horizontal padding: 12px
Icon size: 18px
Item radius: 6px
Gap between icon and label: 10px
```

The active navigation item should use:

* A subtle blue-tinted background
* Brighter text
* Brighter icon
* Optional 2px left indicator

Do not use:

* Gradients
* Large pill-shaped navigation items
* Floating navigation cards
* Different colors for different menu items
* Large logo areas
* Oversized menu labels

Place logout and secondary account actions near the bottom.

---

# 8. Top Header

The top header must remain compact.

Recommended dimensions:

```text
Height: 56px
Horizontal padding: 20px
Border bottom: 1px solid var(--border-default)
Background: var(--surface-default)
```

The header may contain:

* Page context
* ADMIN / EMPLOYEE mode switch
* Current time
* Notifications
* User profile
* Current role

Do not place a large page introduction inside the header.

Do not use:

* Hero-style titles
* Promotional descriptions
* Large avatars
* Oversized mode selectors
* Decorative shadows

---

# 9. Main Content Area

Use:

```text
Background: var(--page-background)
Horizontal padding: 20px
Vertical padding: 20px
Maximum content width: none for operational pages
```

The interface is primarily designed for:

```text
1440px and wider
```

Minimum supported desktop width:

```text
approximately 1280px
```

Mobile-first design is not currently required.

Major content sections should use a vertical gap of:

```text
20px
```

Related elements inside a section should use:

```text
8px or 12px
```

Do not add large empty margins around the application content.

---

# 10. Page Header

Each page should use a compact page header.

Recommended structure:

```text
Page title                         Primary page actions
Optional one-line context          Secondary controls
```

## Page Title

```text
Font size: 24px
Line height: 32px
Font weight: 700
Color: var(--text-primary)
```

## Optional Description

```text
Font size: 13px
Line height: 20px
Color: var(--text-tertiary)
Maximum length: one short line
```

Descriptions should only be included when they explain operational context.

Avoid generic text such as:

```text
물류 현황을 한눈에 확인하세요.
효율적인 운영을 위한 스마트한 대시보드입니다.
오늘도 원활한 배송을 관리해 보세요.
```

Do not add welcome messages to operational pages.

---

# 11. Typography

Use one Korean-compatible sans-serif font family.

Recommended order:

```css
font-family:
  Pretendard,
  "Noto Sans KR",
  Inter,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  sans-serif;
```

Use tabular numbers where numeric comparison is important:

```css
font-variant-numeric: tabular-nums;
```

## Typography Scale

### Page Title

```text
24px / 32px
Weight 700
```

### Major Operational Value

```text
28px / 34px
Weight 700
```

### Section Title

```text
16px / 24px
Weight 600
```

### Component Title

```text
14px / 20px
Weight 600
```

### Body

```text
14px / 21px
Weight 400
```

### Secondary Text

```text
13px / 18px
Weight 400
```

### Metadata and Table Header

```text
12px / 18px
Weight 500 or 600
```

Do not use more than four visibly different font sizes within one content panel.

Avoid:

* Page titles larger than 24px
* KPI values larger than 32px
* Excessive bold text
* Wide letter spacing in Korean text
* Uppercase styling for long Korean labels

---

# 12. Color Usage

## 12.1 Primary Color

Blue is the only general-purpose accent color.

Use blue for:

* Primary buttons
* Active navigation
* Selected filters
* Selected rows
* Links
* Focus indicators
* Active tracking states

Do not assign different accent colors to unrelated sections.

---

## 12.2 Neutral Colors

Most of the interface should use:

* White
* Light gray
* Slate gray
* Dark navy

Neutral colors should occupy the majority of the screen.

Use status colors only where status meaning is present.

---

## 12.3 Status Colors

### Green

Use for:

* Normal operation
* Available
* Arrival complete
* Successful result
* Recommended action

### Red

Use for:

* Delay
* Critical issue
* Serious alert
* Unavailable state

### Orange

Use for:

* Warning
* Conditional state
* Approaching hub
* Arrival soon

### Blue

Use for:

* In transit
* Active tracking
* Informational state

### Gray

Use for:

* Inactive
* Disabled
* Completed secondary state
* Missing or unavailable information

Never communicate status through color alone.

Always include:

* Text label
* Icon, when useful
* Numeric value, when relevant

---

# 13. Borders, Radius, and Shadows

## Borders

Standard panel border:

```css
border: 1px solid var(--border-default);
```

Use stronger borders only for:

* Active selection
* Focus state
* Resizable boundaries
* Important separation

---

## Radius

Use fixed values:

```text
Standard panel: 6px
Button: 6px
Input: 6px
Table container: 6px
Status badge: 4px
Dropdown: 6px
Modal or major overlay: 8px
```

Do not use radius values larger than 8px on authenticated pages.

Pill shapes are reserved for:

* Compact mode switches
* Filter chips
* Small status controls

Do not make general cards, panels, or buttons pill-shaped.

---

## Shadows

Standard components must not use box shadows.

Do not use shadows on:

* KPI cards
* Tables
* Standard panels
* Page sections
* Inputs
* Buttons
* Sidebar
* Header

Shadows are allowed only for:

* Modal dialogs
* Dropdown menus
* Tooltips
* Floating map overlays
* Temporary popovers

Use:

```css
box-shadow: var(--shadow-overlay);
```

Do not introduce multiple shadow levels.

---

# 14. Panels and Surfaces

Use panels for large functional regions.

Examples:

* Map region
* Vehicle table
* Alert list
* Analysis comparison
* Selected item details

Standard panel styling:

```css
background: var(--surface-default);
border: 1px solid var(--border-default);
border-radius: var(--radius-md);
```

Recommended padding:

```text
Compact panel: 12px
Standard panel: 16px
Large analytical panel: 20px
```

Do not place a decorative panel around the entire page.

Do not nest multiple bordered panels without a clear functional hierarchy.

---

# 15. Card Usage Rules

Cards are not the default layout primitive.

Use this priority:

1. Plain page section
2. Bordered functional panel
3. Table or compact list
4. Card only when independent emphasis is required

Cards may be used for:

* Top-level KPI metrics
* Final recommendation
* Important single-state summary

Do not use individual cards for repeated:

* Vehicles
* Hubs
* Alerts
* Delivery destinations
* Activity history
* Notifications
* Search results

Use table rows or compact list items instead.

Strict constraints:

* Maximum four KPI cards in one dashboard row
* No cards nested inside cards
* No separate color theme for each card
* No decorative background graphics inside cards
* No large icon tile inside every card
* No hover lift animation on static information cards

---

# 16. Summary Metrics

Summary metrics should communicate a value immediately.

Recommended structure:

```text
Label
Primary value
Optional comparison or context
```

Example:

```text
지연 차량
3대
전체 차량의 8%
```

Recommended dimensions:

```text
Minimum height: 88px
Maximum height: 104px
Padding: 16px
```

Recommended typography:

```text
Label: 13px, medium, secondary color
Value: 28px, bold, primary color
Support text: 12px, regular, tertiary color
```

Icons are optional.

When an icon is used:

* Use one monochrome icon
* Use a 16px or 18px icon
* Do not place it inside a large colored square
* Do not use different colors for each metric

All summary metric surfaces must remain visually consistent.

---

# 17. Tables

Tables are the preferred presentation for repeated operational data.

Use tables for:

* Vehicle status
* Route status
* Hub status
* ETA data
* Delay data
* Delivery destination data
* Historical operational records

## Dimensions

Recommended values:

```text
Header height: 36px
Row height: 44px
Cell horizontal padding: 12px
```

## Styling

Use:

* Neutral header background or white header
* Light horizontal separators
* Minimal vertical borders
* Clear column alignment
* Tabular numeric values
* Compact status badges

Table headers should use:

```text
12px
Weight 600
Secondary text color
```

Selected rows may use:

* Subtle blue background
* 2px blue left indicator
* Stronger primary text

Do not use:

* Oversized rows
* Rounded cards for individual rows
* Heavy zebra striping
* Multiple status colors in one cell
* Large action buttons inside every row

Row actions should be compact icons or one short text action.

---

# 18. Lists

Use compact lists where table columns are unnecessary.

List item structure may include:

```text
Primary label
Secondary metadata
Right-aligned status or value
```

Recommended values:

```text
Minimum item height: 48px
Vertical padding: 10px
Horizontal padding: 12px
Separator: 1px solid var(--border-default)
```

Do not wrap each list item in an independent card.

Use a shared list container with row separators.

---

# 19. Status Badges

Status badges should be compact and readable.

Recommended styling:

```text
Height: 22px
Horizontal padding: 7px
Radius: 4px
Font size: 12px
Font weight: 600
```

Examples:

```text
정상
운행 중
지연
도착 임박
도착 완료
투입 가능
투입 불가
```

Use lightly tinted backgrounds with readable text colors.

Do not:

* Use saturated solid backgrounds for ordinary statuses
* Display status as a large button
* Add shadows
* Use animated pulses except for a genuinely live critical alert
* use more than one badge for the same status

---

# 20. Buttons

## Primary Button

Use for the main action of a page or section.

```text
Height: 36px
Horizontal padding: 14px
Radius: 6px
Background: primary blue
Text: white
Font size: 13px or 14px
Font weight: 600
```

A page should generally contain one visually dominant primary action.

---

## Secondary Button

Use for non-primary actions.

```text
Background: white
Border: 1px solid var(--border-strong)
Text: var(--text-secondary)
```

---

## Ghost Button

Use for:

* Table row actions
* Toolbar controls
* Minor navigation
* Icon actions

Ghost buttons should not appear as floating decorative elements.

---

## Critical Button

Use red only when the action itself is:

* Destructive
* Irreversible
* Dangerous

Do not use a red action button only because the related vehicle is delayed.

---

## Button Constraints

Do not use:

* Gradient buttons
* Large pill buttons
* Multiple primary buttons in one small section
* Decorative icon-only buttons without labels or tooltips
* Hover movement or scale animations

Hover states should only adjust:

* Background
* Border
* Text color

---

# 21. Form Controls

Inputs, selects, and search fields should use one shared style.

Recommended dimensions:

```text
Height: 36px
Radius: 6px
Horizontal padding: 10px
Font size: 14px
```

Use visible labels when context is not obvious.

Placeholder text must not replace necessary field labels.

Focus state:

```css
border-color: var(--color-primary-500);
outline: 2px solid var(--color-primary-100);
outline-offset: 0;
```

Do not use oversized search fields or floating-label animations.

---

# 22. Filters and Segmented Controls

Filters must remain compact.

Use:

* Select controls
* Short button groups
* Compact filter chips
* Search field
* Status dropdown

Selected filters should use blue emphasis.

Unselected filters should remain neutral.

Do not use a different color for every filter option.

Segmented controls such as ADMIN / EMPLOYEE should:

* Use one contained control
* Maintain equal item heights
* Use a subtle selected background
* Avoid oversized pill styling

---

# 23. Icons

Use one icon library throughout the application.

Recommended options:

* Lucide
* Heroicons
* Material Symbols, when already established

Icons should use:

```text
Default size: 16px
Navigation size: 18px
Large operational icon: maximum 20px
Stroke width: consistent across the application
```

Icons should primarily represent:

* Navigation
* Actions
* Status
* Map controls
* Search and filtering
* Operational entities

Do not:

* Mix filled and outlined styles without a system
* Use emoji as UI icons
* Add icons to every label
* Place every icon inside a colored rounded square
* Use oversized icons as card decoration

---

# 24. Dashboard Layout

Dashboard pages should prioritize:

1. Current operational status
2. Delays and critical problems
3. Vehicle or hub activity
4. Important alerts
5. Recommended actions

Recommended desktop structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ Page Header                                                  │
├────────────┬────────────┬────────────┬───────────────────────┤
│ KPI        │ KPI        │ KPI        │ KPI                   │
├───────────────────────────────────┬─────────────────────────┤
│ Main Map or Operational Overview  │ Alerts / Exceptions     │
│ approximately 65%                 │ approximately 35%       │
├─────────────────────────────────────────────────────────────┤
│ Vehicle Status Table                                        │
└─────────────────────────────────────────────────────────────┘
```

Recommended values:

```text
KPI card height: 96px
Grid gap: 12px
Major section gap: 20px
Main map minimum height: 360px
```

Do not:

* Put every dashboard section into an equal-sized card
* Use a chart when a table or number is more useful
* Place secondary information above current operational status
* Add decorative trend charts without actual business value

---

# 25. Map Screens

Map-centered pages must prioritize the map itself.

Recommended structure:

```text
┌──────────────┬───────────────────────────────┬──────────────┐
│ Filter/List  │ Map                           │ Detail Panel │
└──────────────┴───────────────────────────────┴──────────────┘
```

Recommended dimensions:

```text
Left panel: 280px
Right detail panel: 320px
Map: remaining flexible width
Map minimum width: 55% of available content width
Gap between regions: 12px
Panel padding: 12px
```

The map should not be placed inside multiple decorative containers.

Supporting panels may include:

* Vehicle search
* Status filters
* Vehicle list
* Selected vehicle details
* Route summary

Map markers must distinguish:

* Normal vehicle
* Delayed vehicle
* Approaching vehicle
* Arrived vehicle
* Hub
* Selected vehicle

The selected marker should use:

* Clear outline
* Increased marker scale
* Stronger contrast

Do not use:

* Decorative marker animations
* Large map popups containing full dashboard cards
* Multiple overlapping translucent panels
* Gradient map overlays

Persistent detail panels are preferred over unnecessary modals.

---

# 26. Alert Screens

Alert screens must emphasize severity without making the entire screen visually alarming.

Use:

* Red for serious delay or critical issues
* Orange for warnings
* Green for resolved states
* Neutral surfaces for the surrounding layout

Alert rows should include:

* Alert type
* Vehicle ID
* Route
* Time
* Current status
* Relevant operational metric

Use a compact list or table.

A selected alert may display details in a right-side panel.

Do not:

* Give every alert a large colored card
* Fill entire rows with saturated red
* Use repeated warning icons without purpose
* Open a modal for routine detail inspection

---

# 27. Analysis Screens

Analysis screens must explain how a decision was reached.

Recommended sequence:

```text
Current Situation
        ↓
Option Comparison
        ↓
Calculation Summary
        ↓
Final Recommendation
```

Use a structured analytical layout.

Recommended composition:

```text
┌─────────────────────────────────────────────────────────────┐
│ Current operational context                                 │
├──────────────────────────────┬──────────────────────────────┤
│ Option A                     │ Option B                     │
├─────────────────────────────────────────────────────────────┤
│ Calculation details and assumptions                         │
├─────────────────────────────────────────────────────────────┤
│ Final recommendation                                        │
└─────────────────────────────────────────────────────────────┘
```

The final recommendation may receive stronger emphasis through:

* A 3px status-colored left border
* Slight tinted background
* Stronger title and value
* Clear recommendation badge

Do not use:

* Large gradient result cards
* Celebration graphics
* Oversized status icons
* Recommendation without supporting evidence

Always show relevant supporting values:

* Available time
* Expected work duration
* Return time
* Safety margin
* Remaining time
* Relevant ETA

---

# 28. Detail Panels

Detail panels should remain visually stable and easy to scan.

Recommended structure:

```text
Panel header
Primary status
Key-value information
Operational actions
Optional timeline or metadata
```

Key-value rows should use:

```text
Label width: approximately 40%
Value width: approximately 60%
Row height: 32px to 36px
```

Do not display every value inside a separate mini-card.

Use grouped rows with separators.

---

# 29. Empty, Loading, and Error States

## Empty State

Use:

* Short title
* One-line explanation
* Optional relevant action

Do not use large illustrations.

Example:

```text
표시할 지연 차량이 없습니다.
현재 모든 차량이 정상 운행 중입니다.
```

---

## Loading State

Use:

* Skeleton rows
* Small spinner for local actions
* Stable layout dimensions

Do not replace the entire page with a large loading animation.

---

## Error State

Show:

* Clear error title
* Useful explanation
* Retry action when available

Do not expose raw technical errors to general users.

Use red sparingly around the actual failure message.

---

# 30. Login Screen

The login page may use a different composition from authenticated pages.

Recommended structure:

```text
┌────────────────────────┬────────────────────────┐
│ Product Context        │ Login Form             │
└────────────────────────┴────────────────────────┘
```

The context area may use:

* Solid navy or blue background
* Product name
* Short product description
* Restrained logistics visual

The login form area should remain:

* White
* Simple
* Focused
* Vertically centered

The login page may contain one restrained visual illustration, but it must not use:

* Glassmorphism
* Neon effects
* Multiple gradients
* Abstract floating shapes
* Large marketing sections
* Excessive feature cards

Do not use the authenticated sidebar on the login page.

---

# 31. Motion and Interaction

Motion must support clarity.

Allowed transitions:

```text
Duration: 120ms to 180ms
Properties: background-color, border-color, color, opacity
```

Avoid animating:

* Width
* Height
* Position
* Scale
* Large shadows

Do not use:

* Hover lift effects
* Bouncing icons
* Continuous pulsing
* Decorative page entrance animations
* Large sliding panels without operational need

Map movement and real-time vehicle movement may use functional animation.

Respect reduced-motion preferences where practical.

---

# 32. Responsive Behavior

Primary optimization target:

```text
1280px and wider
```

At narrower desktop widths:

* Preserve critical operational information
* Allow tables to scroll horizontally when required
* Reduce optional metadata
* Keep sidebar behavior consistent
* Prevent important controls from wrapping unpredictably

For map screens:

* Keep the map visible
* Collapse the right detail panel before shrinking the map excessively
* Use a drawer only when the viewport cannot support three columns

Do not redesign the entire application into consumer-style mobile cards unless mobile support becomes an explicit requirement.

---

# 33. Reusable Components

Reuse existing shared components whenever practical.

Shared components should include:

* `AppShell`
* `Sidebar`
* `TopHeader`
* `PageHeader`
* `Panel`
* `MetricCard`
* `StatusBadge`
* `DataTable`
* `CompactList`
* `FilterBar`
* `SearchInput`
* `DetailPanel`
* `AlertList`
* `EmptyState`
* `LoadingState`

Do not create slightly different visual versions of the same component on each page.

Page-specific components may compose shared primitives but must not redefine the design system.

---

# 34. Component Naming and Styling Rules

Component names should describe function rather than visual decoration.

Prefer:

```text
VehicleStatusTable
DelayAlertList
RouteDetailPanel
DashboardMetrics
```

Avoid:

```text
BeautifulCard
GradientPanel
ModernWidget
FancySection
```

Component styling should rely on shared tokens.

Do not use unexplained arbitrary values such as:

```css
padding: 19px;
border-radius: 13px;
color: #4f72ff;
```

Use system values unless a measured layout requirement justifies an exception.

---

# 35. Strict Visual Restraint Rules

The following rules are mandatory:

* Do not use gradients on authenticated pages.
* Do not use glassmorphism.
* Do not use neon colors.
* Do not use glow effects.
* Do not use decorative background shapes.
* Do not use oversized page titles.
* Do not use large promotional subtitles.
* Do not use colored icon containers for every metric.
* Do not give every KPI a different accent color.
* Do not use shadows on standard panels or cards.
* Do not use radius values above 8px.
* Do not make every section a card.
* Do not nest cards inside cards.
* Do not display repeated data as individual cards when a table or list is suitable.
* Do not add charts unless the chart answers a real operational question.
* Do not add animations solely to make the interface feel dynamic.
* Do not redesign functional layouts only to make them appear more fashionable.
* Do not use different visual systems for ADMIN and EMPLOYEE pages.
* Do not introduce fields, metrics, labels, or actions not defined in the project requirements.

---

# 36. Implementation Workflow

Before changing a page:

1. Review the relevant reference images.
2. Review existing shared components.
3. Identify the page's primary operational question.
4. Identify the most important data.
5. Determine whether each dataset should use a table, list, panel, or metric.
6. Confirm the layout proportions.
7. Apply shared tokens.
8. Implement without changing business logic.
9. Compare the result with existing pages.
10. Remove unnecessary decoration.

When requesting UI implementation from an AI coding agent, require it to state:

* Which reference files were inspected
* Which shared components will be reused
* Which layout regions will change
* Which functional logic will remain unchanged

The agent must not proceed based only on generic dashboard conventions.

---

# 37. Review Checklist

Before considering a UI task complete, verify all of the following.

## Layout

* The page uses the shared application shell.
* The major information areas have intentional proportions.
* The page does not contain excessive empty space.
* The primary operational content appears first.
* Repeated data uses a table or compact list.

## Visual Style

* No gradients were introduced.
* No glassmorphism was introduced.
* No decorative glow was introduced.
* Standard panels do not use shadows.
* Standard radius does not exceed 6px.
* Modal or overlay radius does not exceed 8px.
* Colors remain neutral except for primary and status states.

## Typography

* Page title is 24px.
* Section titles are 16px.
* Body text is 14px.
* Numeric values use tabular alignment where useful.
* Text hierarchy is clear without excessive font-size variation.

## Components

* Existing shared components were reused.
* Cards are used only where appropriate.
* Cards are not nested.
* Icons are functional and consistent.
* Buttons follow the shared hierarchy.
* Status badges use consistent meanings and colors.

## Operational Clarity

* The user can identify problems quickly.
* Important status values are easy to scan.
* Delay, ETA, and vehicle state are clearly presented.
* Status is not communicated by color alone.
* Analysis recommendations include supporting values.

## Consistency

* The sidebar matches all authenticated pages.
* The header matches all authenticated pages.
* Spacing follows the shared scale.
* Border and radius values follow the shared tokens.
* The page looks like part of one logistics operations product.

---

# 38. Final Standard

A completed page should look intentionally designed, not automatically decorated.

The interface should feel modern because it is:

* Well aligned
* Proportionally balanced
* Typographically clear
* Visually restrained
* Operationally efficient
* Consistent across pages

When choosing between a more decorative solution and a more precise operational solution, choose the operational solution.
