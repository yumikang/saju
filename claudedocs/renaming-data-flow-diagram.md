# Renaming Service Data Flow Diagram

## Current Flow (Old Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Input Form                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - currentName: "철수"                                     │  │
│  │ - lastName: "김"                                          │  │
│  │ - birthDate: Date                                         │  │
│  │ - birthTime: "14:30"                                      │  │
│  │ - gender: "M"                                             │  │
│  │ - calendarType: "solar"                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           POST /api/renaming/analyze-current                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Request:                                                  │  │
│  │   birthDate, birthTime, isLunar, currentName, gender     │  │
│  │                                                           │  │
│  │ Response:                                                 │  │
│  │   analysisId: "uuid-1234"                                │  │
│  │   currentScore: 65                                       │  │
│  │   elementCounts: { WOOD: 2, FIRE: 1, ... }              │  │
│  │   problems: ["오행 불균형", ...]                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            POST /api/naming/recommend                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Request:                                                  │  │
│  │   birthData: { birthDate, birthTime, isLunar, gender }  │  │
│  │   lastName: "김"                                          │  │
│  │   preferences: {                                          │  │
│  │     minScore: 80,                                         │  │
│  │     maxResults: 10,  ◄──── PROBLEM: Only 10 results     │  │
│  │     gender: "male",                                       │  │
│  │     avoidCharacters: [...]                                │  │
│  │   }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Response                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   success: true,                                          │  │
│  │   data: {                                                 │  │
│  │     candidates: [                                         │  │
│  │       {                                                   │  │
│  │         firstName: ["철", "수"],                          │  │
│  │         characters: [                                     │  │
│  │           { character: "哲", meaning: "슬기로울" },       │  │
│  │           { character: "守", meaning: "지킬" }            │  │
│  │         ],                                                │  │
│  │         scores: { overall: 92 },                         │  │
│  │         ...                                               │  │
│  │       },                                                  │  │
│  │       // ... only 10 items total                         │  │
│  │     ],                                                    │  │
│  │     saju: { ... }                                         │  │
│  │   },                                                      │  │
│  │   metadata: { ... }                                       │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           Manual Transformation (Lines 574-599)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ const transformedNames = candidates.slice(0, 5).map()    │  │
│  │                                                           │  │
│  │ Creates simplified structure:                             │  │
│  │   {                                                       │  │
│  │     name: "김철수",                                       │  │
│  │     hanja: "金哲守",                                      │  │
│  │     meaning: "슬기로울 지킬",                             │  │
│  │     score: 92,                                            │  │
│  │     improvement: "+27",  ◄── vs currentScore             │  │
│  │     details: candidate                                    │  │
│  │   }                                                       │  │
│  │                                                           │  │
│  │ PROBLEMS:                                                 │  │
│  │ - Only takes first 5 (loses 5 candidates)                │  │
│  │ - No tier classification                                  │  │
│  │ - Loses detailed scoring structure                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│             RenamingResults Component (Old)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Display Logic:                                            │  │
│  │                                                           │  │
│  │ [Name 1 - 92점] +27점 개선                                │  │
│  │ [Name 2 - 90점] +25점 개선                                │  │
│  │ [Name 3 - 88점] +23점 개선                                │  │
│  │ [Name 4 - 87점] +22점 개선                                │  │
│  │ [Name 5 - 85점] +20점 개선                                │  │
│  │                                                           │  │
│  │ [결제하고 상세보기] [전문가 상담받기]                     │  │
│  │                                                           │  │
│  │ PROBLEMS:                                                 │  │
│  │ - No freemium structure                                   │  │
│  │ - All names shown (no preview/locked tiers)               │  │
│  │ - Weak conversion incentive                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## New Flow (Freemium V2 Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Input Form                          │
│                         (Unchanged)                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           POST /api/renaming/analyze-current                    │
│                         (Unchanged)                             │
│  Returns: analysisId, currentScore: 65                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            POST /api/naming/recommend                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Request: (CHANGED)                                        │  │
│  │   birthData: { ... }                                      │  │
│  │   lastName: "김"                                          │  │
│  │   preferences: {                                          │  │
│  │     minScore: 80,                                         │  │
│  │     maxResults: 20,  ◄──── CHANGED: 10 → 20             │  │
│  │     gender: "male",                                       │  │
│  │     avoidCharacters: [...]                                │  │
│  │   }                                                       │  │
│  │                                                           │  │
│  │ WHY 20?                                                   │  │
│  │ - Need minimum 12 for classification                      │  │
│  │ - Buffer for filtering edge cases                         │  │
│  │ - API can handle 100+ easily                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Response                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   success: true,                                          │  │
│  │   data: {                                                 │  │
│  │     candidates: [                                         │  │
│  │       ScoredCandidate,  // 92점 ← 1위                    │  │
│  │       ScoredCandidate,  // 91점 ← 2위                    │  │
│  │       ScoredCandidate,  // 90점 ← 3위                    │  │
│  │       ...                                                 │  │
│  │       ScoredCandidate,  // 82점 ← 10위                   │  │
│  │       ScoredCandidate,  // 81점 ← 11위 (FREE)            │  │
│  │       ScoredCandidate,  // 80점 ← 12위 (FREE)            │  │
│  │       ...                                                 │  │
│  │       ScoredCandidate,  // 78점 ← 20위                   │  │
│  │     ],  // Now 20 items                                   │  │
│  │     saju: { ... }                                         │  │
│  │   }                                                       │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│    Classification: classifyRenamingCandidates()                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Input: candidates[] (20 items, sorted by score)          │  │
│  │                                                           │  │
│  │ Logic:                                                    │  │
│  │   locked = candidates.slice(0, 10)    // 1-10위          │  │
│  │   free = candidates.slice(10, 12)     // 11-12위         │  │
│  │   remaining = candidates.slice(12)    // 13-20위         │  │
│  │                                                           │  │
│  │ Output: RenamingFreemiumTiers                            │  │
│  │   {                                                       │  │
│  │     locked: [                                             │  │
│  │       ScoredCandidate(92),  // 1위                       │  │
│  │       ScoredCandidate(91),  // 2위                       │  │
│  │       ...                                                 │  │
│  │       ScoredCandidate(82),  // 10위                      │  │
│  │     ],                                                    │  │
│  │     free: [                                               │  │
│  │       ScoredCandidate(81),  // 11위 ✅ FREE              │  │
│  │       ScoredCandidate(80),  // 12위 ✅ FREE              │  │
│  │     ],                                                    │  │
│  │     remaining: [...]  // 13-20위                         │  │
│  │   }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│   Metrics: calculateRenamingPsychologicalMetrics()              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Input: tiers, currentNameScore (65)                      │  │
│  │                                                           │  │
│  │ Calculations:                                             │  │
│  │   topScore = 92               // locked[0]               │  │
│  │   freeTopScore = 81           // free[0]                 │  │
│  │   scoreDifference = 11        // 92 - 81                 │  │
│  │   improvementFromCurrent = 27 // 92 - 65                 │  │
│  │   conversionMessage = "1위 이름은 현재보다 27점이나..."   │  │
│  │                                                           │  │
│  │ Output: RenamingPsychologicalMetrics                     │  │
│  │   {                                                       │  │
│  │     topScore: 92,                                         │  │
│  │     freeTopScore: 81,                                     │  │
│  │     scoreDifference: 11,                                  │  │
│  │     improvementFromCurrent: 27,                           │  │
│  │     lockedCount: 10,                                      │  │
│  │     totalCount: 20,                                       │  │
│  │     conversionMessage: "...",                             │  │
│  │     currentNameScore: 65                                  │  │
│  │   }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│           RenamingResultsLayout Component (New)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │ ╔═══════════════════════════════════════════════════╗    │  │
│  │ ║         🎁 무료 체험 개명 (11-12위)              ║    │  │
│  │ ╚═══════════════════════════════════════════════════╝    │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────┐      │  │
│  │ │ 11등 (무료)        김철민 (金哲民)      81점  │      │  │
│  │ │ 슬기로울 백성                                   │      │  │
│  │ │ 현재보다 +16점 개선                             │      │  │
│  │ │                                                 │      │  │
│  │ │ ✓ 오행 조화: 85점                               │      │  │
│  │ │ ✓ 음양 균형: 80점                               │      │  │
│  │ │ [상위 1-10위 보기]                              │      │  │
│  │ └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────┐      │  │
│  │ │ 12등 (무료)        김철수 (金哲守)      80점  │      │  │
│  │ │ 슬기로울 지킬                                   │      │  │
│  │ │ 현재보다 +15점 개선                             │      │  │
│  │ │                                                 │      │  │
│  │ │ ✓ 오행 조화: 83점                               │      │  │
│  │ │ ✓ 음양 균형: 79점                               │      │  │
│  │ │ [상위 1-10위 보기]                              │      │  │
│  │ └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │ ╔═══════════════════════════════════════════════════╗    │  │
│  │ ║       🚀 프리미엄 CTA (Conversion Zone)          ║    │  │
│  │ ╚═══════════════════════════════════════════════════╝    │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────┐      │  │
│  │ │ 💎 1-10위 최고 점수 개명 10개 잠금 해제         │      │  │
│  │ │                                                 │      │  │
│  │ │ "1위 이름은 현재보다 27점이나 개선된            │      │  │
│  │ │  완벽한 이름입니다!"                            │      │  │
│  │ │                                                 │      │  │
│  │ │ 정가 150,000원 → 120,000원 (20% 할인)          │      │  │
│  │ │                                                 │      │  │
│  │ │ [💳 120,000원 결제하고 1-10위 확인하기]         │      │  │
│  │ └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │ ╔═══════════════════════════════════════════════════╗    │  │
│  │ ║      🔒 프리미엄 개명 (1-10위) - LOCKED          ║    │  │
│  │ ╚═══════════════════════════════════════════════════╝    │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────┐      │  │
│  │ │ 🏆 1등 (프리미엄)   김●● (金●●)     92점    │      │  │
│  │ │ ●●●● ●●                        [BLUR]     │      │  │
│  │ │ 현재보다 +27점 개선                             │      │  │
│  │ │                                                 │      │  │
│  │ │ [🔓 결제하고 잠금 해제]                          │      │  │
│  │ └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │ ┌─────────────────────────────────────────────────┐      │  │
│  │ │ 🥈 2등 (프리미엄)   김●● (金●●)     91점    │      │  │
│  │ │ ...                                [BLUR]     │      │  │
│  │ └─────────────────────────────────────────────────┘      │  │
│  │                                                           │  │
│  │ ... (3-10위 similar locked cards)                        │  │
│  │                                                           │  │
│  │ ╔═══════════════════════════════════════════════════╗    │  │
│  │ ║          💡 개명 선택 가이드                     ║    │  │
│  │ ╚═══════════════════════════════════════════════════╝    │  │
│  │                                                           │  │
│  │ ✓ 점수가 높을수록 사주와 조화가 잘 맞습니다          │  │
│  │ ✓ 현재 이름 대비 개선도를 확인하세요                │  │
│  │ ✓ 결제 후 1-10위 최고 점수 개명을 모두 확인         │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ User clicks payment CTA
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              RenamingPaymentModal                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Payment Processing:                                       │  │
│  │ - Integration with TossPayments                           │  │
│  │ - Amount: 120,000원                                       │  │
│  │ - Product: "개명 프리미엄 (1-10위)"                       │  │
│  │                                                           │  │
│  │ Success Flow:                                             │  │
│  │   1. Payment confirmation                                 │  │
│  │   2. Backend records payment                              │  │
│  │   3. Update premium status                                │  │
│  │   4. Unlock locked content                                │  │
│  │   5. Call onPaymentSuccess(orderId)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Premium Content Unlocked                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Now user sees:                                            │  │
│  │                                                           │  │
│  │ ✅ 11-12위 (FREE) - Still visible                         │  │
│  │                                                           │  │
│  │ 🔓 1-10위 (UNLOCKED) - Now fully visible:                 │  │
│  │    - Full name revealed                                   │  │
│  │    - Complete hanja                                       │  │
│  │    - Detailed scoring breakdown                           │  │
│  │    - Element harmony analysis                             │  │
│  │    - Numerology grids                                     │  │
│  │    - Download PDF report option                           │  │
│  │                                                           │  │
│  │ User can now:                                             │  │
│  │ - Compare all 12 names                                    │  │
│  │ - Review detailed analysis                                │  │
│  │ - Make informed decision                                  │  │
│  │ - Proceed with legal name change process                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Structure Comparison

### Old Structure (RecommendationItem)
```typescript
interface RecommendationItem {
  name: string;           // "김철수"
  hanja: string;          // "金哲守"
  meaning: string;        // "슬기로울 지킬"
  score: number;          // 92
  improvement: string;    // "+27"
  details?: unknown;      // Original candidate
}

// Used in flat list - no tiers
const recommendations: RecommendationItem[] = [
  { name: "김철수", score: 92, ... },
  { name: "김민수", score: 90, ... },
  { name: "김지민", score: 88, ... },
  { name: "김서준", score: 87, ... },
  { name: "김예준", score: 85, ... }
];
```

### New Structure (Tiered Classification)
```typescript
interface RenamingFreemiumTiers {
  locked: ScoredCandidate[];    // 1-10위
  free: ScoredCandidate[];      // 11-12위
  remaining: ScoredCandidate[]; // 13+위
}

interface ScoredCandidate {
  firstName: [string, string];
  characters: [HanjaCharacter, HanjaCharacter];
  scores: {
    overall: number;          // Primary score
    elementHarmony: DetailedScore;
    yinYangBalance: DetailedScore;
    numerology: DetailedScore;
    meaningHarmony: DetailedScore;
  };
  analysis: NameAnalysis;     // Full analysis data
  confidenceScore: number;
}

// Used with tier structure
const tiers: RenamingFreemiumTiers = {
  locked: [
    ScoredCandidate(92),  // 1위
    ScoredCandidate(91),  // 2위
    // ... 8 more
  ],
  free: [
    ScoredCandidate(81),  // 11위
    ScoredCandidate(80),  // 12위
  ],
  remaining: [...]
};

const metrics: RenamingPsychologicalMetrics = {
  topScore: 92,
  freeTopScore: 81,
  scoreDifference: 11,
  improvementFromCurrent: 27,
  conversionMessage: "1위 이름은 현재보다 27점이나...",
  // ... more metrics
};
```

---

## Key Differences

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| **Candidates** | 10 total (all shown) | 20 total (tiered display) |
| **Structure** | Flat list | Tiered (locked/free/remaining) |
| **Data Type** | Simplified `RecommendationItem` | Full `ScoredCandidate` |
| **Free Preview** | None (all paid) | 11-12위 (2 names free) |
| **Premium** | All 5 names locked | 1-10위 (10 names locked) |
| **Scoring** | Simple score number | Detailed breakdown |
| **Conversion** | Generic CTA | Psychologically optimized |
| **Comparison** | Basic improvement | Current name vs top tier |

---

## Conversion Psychology Flow

```
Step 1: BUILD TRUST (Free Names)
┌─────────────────────────────────┐
│ Show 11-12위 (81-80점)          │
│ - Real names, not blurred       │
│ - Full details visible          │
│ - Shows improvement from current│
│ - Demonstrates quality          │
└─────────────────────────────────┘
          │
          ▼ "This is good quality!"
          │
Step 2: CREATE DESIRE (Metrics)
┌─────────────────────────────────┐
│ "But 1위 is 11점 better!"       │
│ "27점 improvement from current!"│
│ "10 premium names available"    │
│ - Quantifiable benefit          │
│ - Scarcity (limited to 10)     │
│ - Urgency (20% discount)        │
└─────────────────────────────────┘
          │
          ▼ "I want the best!"
          │
Step 3: SHOW VALUE (Locked Preview)
┌─────────────────────────────────┐
│ Display 1-10위 (blurred)        │
│ - Shows scores (92, 91, 90...)  │
│ - Teases quality                │
│ - Creates FOMO                  │
│ - Multiple options available    │
└─────────────────────────────────┘
          │
          ▼ "I need to see these!"
          │
Step 4: REDUCE FRICTION (CTA)
┌─────────────────────────────────┐
│ One-click payment               │
│ - Clear price (120,000원)       │
│ - Discount messaging (20% off)  │
│ - Immediate access promise      │
│ - Trusted payment (TossPayments)│
└─────────────────────────────────┘
          │
          ▼ CONVERSION! 💰
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Related**: renaming-integration-analysis.md
