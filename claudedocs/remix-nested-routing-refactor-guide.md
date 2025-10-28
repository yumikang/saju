# Remix Nested Routing Refactor Guide

## Overview
This guide provides comprehensive patterns for refactoring `/Users/blee/Downloads/saju/saju/app/routes/renaming.tsx` (827 lines) into URL-based nested routes following Remix conventions, based on the existing `naming.freemium.*` pattern.

---

## 1. File Naming Conventions

### Current Pattern Analysis
Your existing naming routes use the **dot delimiter (`.`)** convention:
```
naming.tsx                      → /naming (parent layout)
naming.freemium._index.tsx      → /naming/freemium (step 1)
naming.freemium.analysis.tsx    → /naming/freemium/analysis (step 2)
naming.freemium.results.tsx     → /naming/freemium/results (step 3)
```

### Recommended File Structure for Renaming

```
app/routes/
├── renaming.tsx                    → /renaming (parent layout with shared progress UI)
├── renaming._index.tsx             → /renaming (step 1: input form)
├── renaming.analysis.tsx           → /renaming/analysis (step 2: current name analysis)
├── renaming.results.tsx            → /renaming/results (step 3: recommendations)
└── renaming.experts.tsx            → /renaming/experts (step 4: expert consultation)
```

### Key Naming Rules

**Dot Delimiter (`.`)**: Creates URL paths
- `renaming.analysis.tsx` → `/renaming/analysis`

**Underscore Prefix (`_`)**: Creates index routes or pathless layouts
- `renaming._index.tsx` → `/renaming` (default child route)
- `_layout.tsx` → No URL segment, just layout nesting

**Underscore Suffix (`_`)**: Opts out of parent layout
- `renaming_.analysis.tsx` → `/renaming/analysis` but WITHOUT parent layout

**For Your Use Case**: Use standard dot delimiter without suffix underscore to keep parent layout.

---

## 2. Layout Route Pattern (Parent Route)

### Create: `app/routes/renaming.tsx`

```typescript
/**
 * Renaming Service Layout Route
 *
 * Provides shared layout with progress indicator for all renaming steps.
 * Routes:
 * - /renaming (step 1)
 * - /renaming/analysis (step 2)
 * - /renaming/results (step 3)
 * - /renaming/experts (step 4)
 */

import { Outlet } from '@remix-run/react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function RenamingLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Shared Header */}
      <RenamingHeader />

      {/* Child routes render here via <Outlet /> */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <RenamingFooter />
    </div>
  );
}

function RenamingHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-purple-100">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
          <Sparkles className="inline w-6 h-6 mr-2" />
          이름 개명 서비스
        </h1>
      </div>
    </header>
  );
}

function RenamingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-6 max-w-4xl text-center text-sm text-gray-600">
        © 2025 이름 개명 서비스. All rights reserved.
      </div>
    </footer>
  );
}
```

---

## 3. Progress Indicator Component (Shared State)

### Option A: URL-Based Progress (Recommended)

Create a shared component that determines current step from URL:

```typescript
// app/components/renaming/ProgressIndicator.tsx

import { useLocation } from '@remix-run/react';
import { cn } from '~/lib/utils';

interface Step {
  number: number;
  label: string;
  path: string;
}

const STEPS: Step[] = [
  { number: 1, label: '현재 이름 입력', path: '/renaming' },
  { number: 2, label: '사주 분석', path: '/renaming/analysis' },
  { number: 3, label: '개명 추천', path: '/renaming/results' },
  { number: 4, label: '전문가 상담', path: '/renaming/experts' },
];

export function ProgressIndicator() {
  const location = useLocation();

  // Determine current step from pathname
  const currentStep = STEPS.find(step => {
    if (step.path === '/renaming') {
      return location.pathname === '/renaming';
    }
    return location.pathname.startsWith(step.path);
  })?.number || 1;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => (
        <>
          <div
            key={step.number}
            className="flex items-center gap-2 text-sm"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors',
                currentStep === step.number
                  ? 'bg-purple-500 text-white'
                  : currentStep > step.number
                  ? 'bg-purple-300 text-white'
                  : 'bg-gray-300 text-white'
              )}
            >
              {currentStep > step.number ? '✓' : step.number}
            </div>
            <span
              className={cn(
                'transition-colors',
                currentStep === step.number
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500'
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className="w-8 border-t-2 border-gray-300" />
          )}
        </>
      ))}
    </div>
  );
}
```

### Add Progress Indicator to Layout

```typescript
// app/routes/renaming.tsx (updated)

import { Outlet } from '@remix-run/react';
import { ProgressIndicator } from '~/components/renaming/ProgressIndicator';

export default function RenamingLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <RenamingHeader />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress indicator shared across all steps */}
        <ProgressIndicator />

        {/* Child routes render here */}
        <Outlet />
      </main>
      <RenamingFooter />
    </div>
  );
}
```

---

## 4. Data Passing Between Routes

### Pattern 1: Search Params (Recommended for Multi-Step Flows)

**Best for**: Session IDs, analysis IDs, temporary flow state

**Example Flow**:
```
Step 1: /renaming
  ↓ (submit form, get sessionId from API)
Step 2: /renaming/analysis?sessionId=abc123
  ↓ (analysis complete, get analysisId from API)
Step 3: /renaming/results?sessionId=abc123&analysisId=xyz789
  ↓ (select option, proceed to experts)
Step 4: /renaming/experts?sessionId=abc123&analysisId=xyz789
```

**Implementation**:

```typescript
// Step 1: app/routes/renaming._index.tsx
import { useNavigate } from '@remix-run/react';

export default function RenamingInputPage() {
  const navigate = useNavigate();

  const handleSubmit = async (formData: FormData) => {
    const response = await fetch('/api/renaming/analyze-current', {
      method: 'POST',
      body: JSON.stringify({ /* data */ }),
    });

    const result = await response.json();

    if (result.success) {
      // Navigate to next step with sessionId in search params
      navigate(`/renaming/analysis?sessionId=${result.sessionId}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

```typescript
// Step 2: app/routes/renaming.analysis.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';

export default function RenamingAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      // Redirect back if no sessionId
      navigate('/renaming');
      return;
    }

    // Fetch analysis using sessionId
    fetch(`/api/renaming/analysis/${sessionId}`)
      .then(res => res.json())
      .then(data => setAnalysis(data));
  }, [sessionId]);

  const handleContinue = () => {
    // Pass sessionId to next step
    navigate(`/renaming/results?sessionId=${sessionId}`);
  };

  return (
    <div>
      {analysis && (
        <>
          {/* Display analysis */}
          <button onClick={handleContinue}>다음 단계</button>
        </>
      )}
    </div>
  );
}
```

**Advantages**:
- ✅ Shareable URLs (users can bookmark specific steps)
- ✅ Works with browser back/forward buttons
- ✅ SSR-friendly (accessible in loaders)
- ✅ No state management needed

**Disadvantages**:
- ❌ Visible in URL (don't put sensitive data)
- ❌ Limited size (URL length limits)

---

### Pattern 2: Loader Data (For Server-Side Data)

**Best for**: Fetching data based on search params in loader, then accessing via `useLoaderData()`

```typescript
// app/routes/renaming.analysis.tsx

import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    throw new Response('Session ID required', { status: 400 });
  }

  // Fetch analysis from database
  const analysis = await db.renamingAnalysis.findUnique({
    where: { sessionId },
  });

  if (!analysis) {
    throw new Response('Analysis not found', { status: 404 });
  }

  return json({ analysis, sessionId });
}

export default function RenamingAnalysisPage() {
  const { analysis, sessionId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate(`/renaming/results?sessionId=${sessionId}`);
  };

  return (
    <div>
      {/* Display analysis */}
      <button onClick={handleContinue}>다음 단계</button>
    </div>
  );
}
```

**Advantages**:
- ✅ Server-side data fetching
- ✅ Type-safe with TypeScript
- ✅ Automatic revalidation on navigation
- ✅ Can access parent loader data via `useMatches()`

---

### Pattern 3: SessionStorage (For Sensitive/Large Data)

**Best for**: Temporary data that shouldn't be in URL (form data, user input)

```typescript
// Step 1: Save to sessionStorage
const handleSubmit = (formData: FormData) => {
  const data = {
    currentName: formData.get('currentName'),
    birthDate: formData.get('birthDate'),
    // ... other fields
  };

  sessionStorage.setItem('renaming_input', JSON.stringify(data));
  navigate('/renaming/analysis');
};

// Step 2: Retrieve from sessionStorage
useEffect(() => {
  const savedData = sessionStorage.getItem('renaming_input');
  if (savedData) {
    const parsed = JSON.parse(savedData);
    // Use the data
  }
}, []);
```

**Advantages**:
- ✅ Not visible in URL
- ✅ Larger storage capacity
- ✅ Persists across page refreshes

**Disadvantages**:
- ❌ Client-side only (not accessible in loaders)
- ❌ Not shareable
- ❌ Cleared when browser closes

---

### Pattern 4: useMatches() (Access Parent Loader Data)

**Best for**: Child routes accessing parent route loader data

```typescript
// Parent: app/routes/renaming.tsx (with loader)
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

// Child: app/routes/renaming.analysis.tsx
import { useMatches } from '@remix-run/react';

export default function RenamingAnalysisPage() {
  const matches = useMatches();

  // Find parent route data
  const parentData = matches.find(match => match.id === 'routes/renaming')?.data;
  const user = parentData?.user;

  return <div>Welcome, {user.name}</div>;
}
```

---

## 5. Complete File Structure Example

### Step 1: Input Form

```typescript
// app/routes/renaming._index.tsx

/**
 * Step 1: Current Name Input
 * GET /renaming
 */

import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function RenamingInputPage() {
  const navigate = useNavigate();
  const [currentName, setCurrentName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/renaming/analyze-current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentName, birthDate }),
      });

      const result = await response.json();

      if (result.success) {
        navigate(`/renaming/analysis?sessionId=${result.sessionId}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>현재 이름 입력</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={currentName}
            onChange={(e) => setCurrentName(e.target.value)}
            placeholder="현재 이름"
          />
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : '다음 단계'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### Step 2: Analysis

```typescript
// app/routes/renaming.analysis.tsx

/**
 * Step 2: Saju Analysis of Current Name
 * GET /renaming/analysis?sessionId=xxx
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export default function RenamingAnalysisPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      navigate('/renaming');
      return;
    }

    fetch(`/api/renaming/analysis/${sessionId}`)
      .then(res => res.json())
      .then(data => {
        setAnalysis(data);
        setIsLoading(false);
      });
  }, [sessionId]);

  const handleContinue = () => {
    navigate(`/renaming/results?sessionId=${sessionId}`);
  };

  if (isLoading) {
    return <div>분석 중...</div>;
  }

  return (
    <Card>
      {/* Display analysis results */}
      <Button onClick={handleContinue}>개명 추천 보기</Button>
    </Card>
  );
}
```

---

### Step 3: Results

```typescript
// app/routes/renaming.results.tsx

/**
 * Step 3: Name Recommendations
 * GET /renaming/results?sessionId=xxx
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';

export default function RenamingResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (!sessionId) {
      navigate('/renaming');
      return;
    }

    fetch(`/api/renaming/recommend?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setRecommendations(data.recommendations));
  }, [sessionId]);

  const handleSelectExpert = () => {
    navigate(`/renaming/experts?sessionId=${sessionId}`);
  };

  return (
    <div>
      {/* Display recommendations */}
      <button onClick={handleSelectExpert}>전문가 상담하기</button>
    </div>
  );
}
```

---

### Step 4: Expert Consultation

```typescript
// app/routes/renaming.experts.tsx

/**
 * Step 4: Expert Consultation
 * GET /renaming/experts?sessionId=xxx
 */

import { useSearchParams } from '@remix-run/react';

export default function RenamingExpertsPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  return (
    <div>
      {/* Expert consultation UI */}
    </div>
  );
}
```

---

## 6. Best Practices Summary

### ✅ DO

1. **Use search params for flow state**: `?sessionId=abc123`
2. **Use loaders for server-side data**: Fetch from DB in loader, access via `useLoaderData()`
3. **Use `<Outlet />` in parent**: Render child routes in parent layout
4. **URL-based progress indicators**: Determine current step from `location.pathname`
5. **Validate session data**: Always check if sessionId exists, redirect if missing
6. **Handle errors gracefully**: Show user-friendly error messages

### ❌ DON'T

1. **Don't use trailing underscore** unless you want to opt out of parent layout
2. **Don't store sensitive data in search params**: Use sessionStorage or server sessions
3. **Don't rely on React state** for navigation flow (it won't persist on refresh)
4. **Don't forget error handling**: Always handle missing sessionId, API errors
5. **Don't skip validation**: Validate sessionId on both client and server

---

## 7. Migration Strategy

### Phase 1: Extract Components
1. Extract reusable UI components from `renaming.tsx`
2. Create shared types and interfaces
3. Test components in isolation

### Phase 2: Create Routes
1. Create parent layout: `renaming.tsx`
2. Create step 1: `renaming._index.tsx`
3. Create step 2: `renaming.analysis.tsx`
4. Create step 3: `renaming.results.tsx`
5. Create step 4: `renaming.experts.tsx`

### Phase 3: Implement Data Flow
1. Add search params to navigation calls
2. Implement sessionStorage for form data
3. Add loaders for server-side data fetching
4. Test full flow end-to-end

### Phase 4: Polish
1. Add loading states
2. Add error boundaries
3. Add progress indicator
4. Test browser back/forward
5. Test direct URL access

---

## 8. Quick Reference: File Naming Cheatsheet

| Pattern | File Name | URL | Behavior |
|---------|-----------|-----|----------|
| Parent layout | `renaming.tsx` | `/renaming` | Wraps all child routes with `<Outlet />` |
| Index route | `renaming._index.tsx` | `/renaming` | Default child route (step 1) |
| Child route | `renaming.analysis.tsx` | `/renaming/analysis` | Step 2 (inherits parent layout) |
| Child route | `renaming.results.tsx` | `/renaming/results` | Step 3 (inherits parent layout) |
| Opt-out layout | `renaming_.analysis.tsx` | `/renaming/analysis` | Step 2 WITHOUT parent layout |
| Pathless layout | `renaming._analysis.tsx` | (no URL) | Layout only, no URL segment |
| Dynamic segment | `renaming.$id.tsx` | `/renaming/:id` | Dynamic parameter |

---

## 9. Additional Resources

- **Remix Docs**: https://remix.run/docs/en/main/file-conventions/route-files-v2
- **Routing Guide**: https://remix.run/docs/en/main/guides/routing
- **Data Loading**: https://remix.run/docs/en/main/guides/data-loading
- **useSearchParams**: https://remix.run/docs/en/main/hooks/use-search-params
- **useLoaderData**: https://remix.run/docs/en/main/hooks/use-loader-data
- **useMatches**: https://remix.run/docs/en/main/hooks/use-matches

---

## 10. Example: Your Specific Use Case

Based on your 827-line `renaming.tsx`, here's the recommended structure:

```
app/routes/
├── renaming.tsx                    # Parent layout with ProgressIndicator
├── renaming._index.tsx             # Step 1: Current name input form
├── renaming.analysis.tsx           # Step 2: Saju analysis of current name
├── renaming.results.tsx            # Step 3: New name recommendations
└── renaming.experts.tsx            # Step 4: Expert consultation booking

Data Flow:
Step 1 → API call → sessionId → /renaming/analysis?sessionId=abc123
Step 2 → API call → analysisId → /renaming/results?sessionId=abc123&analysisId=xyz789
Step 3 → Select option → /renaming/experts?sessionId=abc123&selectedName=김지우
```

**Key Decision**: Use **search params** for sessionId (visible, shareable, SSR-friendly) and **sessionStorage** for sensitive form data (hidden, larger capacity).

---

## Conclusion

This guide provides everything you need to refactor your large route file into clean, maintainable nested routes following Remix conventions. The pattern you're already using (`naming.freemium.*`) is the correct approach, so apply the same pattern to your renaming flow.

**Recommended approach for your use case**:
1. Create parent layout: `renaming.tsx` with progress indicator
2. Use dot delimiter for child routes: `renaming._index.tsx`, `renaming.analysis.tsx`, etc.
3. Pass data via search params: `?sessionId=xxx`
4. Fetch data in loaders when needed
5. Use sessionStorage for sensitive/temporary data

Good luck with your refactor! 🚀
