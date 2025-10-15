# Phase 3 Implementation Status

**Date**: 2025-10-15
**Status**: Starting Phase 3.1 Implementation

---

## Current State Analysis

### Existing Files

1. **naming.tsx** (584 lines)
   - Type: Prototype/Demo
   - Features: Step wizard, mock data, payment UI
   - Issues: Not integrated with Phase 2 APIs
   - Action: Needs refactoring to Layout Route

2. **naming.favorites.tsx** (398 lines)
   - Type: Complete feature
   - Features: Favorites management with database
   - Status: ✅ Complete and functional

3. **naming.history.tsx** (248 lines)
   - Type: Complete feature
   - Features: History with infinite scroll
   - Status: ✅ Complete and functional

### Installed Shadcn/UI Components

✅ Existing:
- button, calendar, card, hanja-selector, popover, table, toast, toaster

✅ Just Installed (Phase 3.1):
- dialog, input, label, select, badge, skeleton

### Phase 2 APIs (All Working)

✅ POST /api/naming/analyze
- Input: birthDate, birthTime, isLunar, gender
- Output: sajuDataId, pillars, elementCounts, etc.
- Performance: 8-60ms

✅ POST /api/naming/recommend
- Input: sajuDataId OR birthData, lastName, preferences
- Output: 30-50 candidates with scores
- Performance: 16-36ms

✅ GET /api/naming/character/:id
- Input: characterId or character
- Output: Character details with readings
- Performance: <200ms

---

## Phase 3.1 Implementation Plan

### Step 1: Refactor naming.tsx → Layout Route ✅ (Next)

**Goal**: Transform into Remix Layout Route with Outlet

**Tasks**:
- [x] Research Shadcn/UI patterns (Context7)
- [x] Install missing components
- [ ] Backup current naming.tsx content
- [ ] Create Layout Route with:
  - NamingHeader component
  - Outlet for nested routes
  - ErrorBoundary
  - Consistent styling

### Step 2: Create Input Form Page

**File**: `app/routes/naming._index.tsx`

**Features**:
- BirthInfoForm component
- DateTimePicker (Calendar + Time input)
- CalendarTypeToggle (양력/음력)
- GenderSelect
- LastNameInput
- Form validation with Zod
- Action: POST to /api/naming/analyze
- Redirect: → /naming/analysis/:sajuDataId

**Components to Build**:
- BirthInfoForm (main form)
- DateTimePicker (Shadcn Calendar + Input)
- FormField wrappers

### Step 3: Create Analysis Page

**File**: `app/routes/naming.analysis.$id.tsx`

**Features**:
- Loader: Fetch sajuData by ID from database
- SajuAnalysisCard component
- ElementDistributionChart (Chart.js radar)
- PillarDisplay (사주팔자 grid)
- ElementBadge components
- Action: POST to /api/naming/recommend with lastName
- Redirect: → /naming/results/:id

**Components to Build**:
- SajuAnalysisCard
- ElementDistributionChart
- PillarDisplay
- ElementBadge

### Step 4: Create Results Page (Phase 3.2)

**File**: `app/routes/naming.results.$id.tsx`

**Features**:
- Loader: Get candidates from API
- NameCandidateList (virtualized)
- FilterBar (score, elements)
- SortControls
- CharacterDetailModal
- Zustand integration

---

## Data Flow

```
User Input (naming._index.tsx)
  ↓ Form Submit
POST /api/naming/analyze
  ↓ Returns sajuDataId
Redirect → /naming/analysis/:id
  ↓ Loader fetches sajuData
Show Analysis + Enter lastName
  ↓ Form Submit with lastName
POST /api/naming/recommend
  ↓ Returns candidates (30-50)
Redirect → /naming/results/:id
  ↓ Loader fetches candidates
Show Candidate List (virtualized)
  ↓ Click card
GET /api/naming/character/:id
  ↓ Returns character detail
Show CharacterDetailModal
```

---

## Component Architecture

### Layout Hierarchy

```
naming.tsx (Layout)
├── NamingHeader
├── <Outlet>
│   ├── naming._index.tsx (Input Form)
│   ├── naming.analysis.$id.tsx (Analysis)
│   ├── naming.results.$id.tsx (Results)
│   ├── naming.favorites.tsx ✅ (Existing)
│   └── naming.history.tsx ✅ (Existing)
└── NamingFooter
```

### Component Structure

**Domain Components** (`app/components/naming/`):
- BirthInfoForm
- SajuAnalysisCard
- ElementDistributionChart
- PillarDisplay
- NameCard
- NameCandidateList
- FilterBar
- CharacterDetailModal

**UI Components** (`app/components/ui/`):
- DateTimePicker (custom)
- ElementBadge (custom)
- StepIndicator (custom)
- All Shadcn components

---

## State Management Strategy

### Server State (Remix Loader/Action)
- Saju analysis data
- Name candidates
- Character details
- User history/favorites

### Client State (Zustand)
- Filter settings (minScore, maxScore, elements)
- Sort preferences (score, strokes, meaning)
- Favorites list (IDs)
- Modal state (selectedCharacterId)
- Current session (currentSajuId)

### Persistence (Zustand persist middleware)
- favorites: string[]
- currentSajuId: string | null

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Saju analysis API | < 100ms | ✅ 8-60ms |
| Name recommendation API | < 5s | ✅ 16-36ms |
| Character lookup API | < 300ms | ✅ <200ms |
| List rendering | < 200ms | ⏳ TBD |
| Filter application | < 100ms | ⏳ TBD |
| Modal open | < 200ms | ⏳ TBD |

---

## Next Actions

### Immediate (Today)
1. ✅ Install Shadcn/UI components
2. ⏳ Refactor naming.tsx → Layout Route
3. ⏳ Create naming._index.tsx with BirthInfoForm
4. ⏳ Build DateTimePicker component
5. ⏳ Integrate with POST /api/naming/analyze

### Tomorrow
1. Create naming.analysis.$id.tsx
2. Build SajuAnalysisCard component
3. Integrate Chart.js for ElementDistributionChart
4. Build PillarDisplay component
5. Test full flow: Input → Analysis

### Day 3
1. Set up Zustand store
2. Start naming.results.$id.tsx
3. Build NameCandidateList with virtualization
4. Build NameCard component

---

## Technical Decisions

### ADR-001: Keep Existing Routes
**Decision**: Keep naming.favorites.tsx and naming.history.tsx as-is
**Rationale**: They're complete, functional, and use proper patterns

### ADR-002: Refactor naming.tsx
**Decision**: Transform into Layout Route, move wizard to separate routes
**Rationale**: Proper Remix nested routing, better code organization, integrates with Phase 2 APIs

### ADR-003: Use Remix Native State First
**Decision**: Use Remix loader/action for server state, delay Zustand until Phase 3.2
**Rationale**: Simpler implementation, leverage Remix strengths, add client state when needed for filters

---

## Files to Create

### Phase 3.1
- [ ] app/routes/naming.tsx (refactored Layout)
- [ ] app/routes/naming._index.tsx (input form)
- [ ] app/routes/naming.analysis.$id.tsx (analysis page)
- [ ] app/components/naming/BirthInfoForm.tsx
- [ ] app/components/naming/SajuAnalysisCard.tsx
- [ ] app/components/naming/PillarDisplay.tsx
- [ ] app/components/ui/date-time-picker.tsx
- [ ] app/components/ui/element-badge.tsx
- [ ] app/components/ui/step-indicator.tsx

### Phase 3.2
- [ ] app/routes/naming.results.$id.tsx
- [ ] app/store/naming.store.ts (Zustand)
- [ ] app/components/naming/NameCandidateList.tsx
- [ ] app/components/naming/NameCard.tsx
- [ ] app/components/naming/FilterBar.tsx
- [ ] app/components/naming/CharacterDetailModal.tsx
- [ ] app/components/ui/element-chart.tsx

---

## Integration Points

### With Phase 2 APIs
- Input Form → POST /api/naming/analyze
- Analysis Page → POST /api/naming/recommend
- Results Page → GET /api/naming/character/:id

### With Existing Routes
- Results Page → Save to favorites (naming.favorites.tsx)
- Header → Link to history (naming.history.tsx)
- Header → Link to favorites (naming.favorites.tsx)

### With Database
- SajuData model (created by Phase 2 analyze API)
- NamingResult model (used by favorites/history)
- Favorite model (used by favorites page)

---

## Testing Strategy

### Unit Tests
- BirthInfoForm validation
- Date/time picker edge cases
- Element calculation logic
- Score filtering logic

### Integration Tests
- Full flow: Input → Analysis → Results
- API integration with Phase 2 endpoints
- Error handling and edge cases

### E2E Tests (Playwright)
- Complete naming flow
- Mobile responsiveness
- Accessibility (keyboard navigation)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-15 | 0.1 | Initial implementation plan created |
| 2025-10-15 | 0.2 | Shadcn/UI components installed |
